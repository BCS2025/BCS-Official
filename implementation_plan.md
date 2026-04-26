# 比創空間官網 全面重構實作計畫

**版本：** v1.0  
**日期：** 2026-04-16  
**作者：** 黃詣 × Claude  
**目標：** 將現有購物網站升級為比創空間三品牌官方網站，保留完整電商能力，並具備極佳 UX 體驗。

---

## 目錄

1. [專案目標與限制](#1-專案目標與限制)
2. [架構決策記錄 (ADR)](#2-架構決策記錄-adr)
3. [設計系統規格](#3-設計系統規格)
4. [網站地圖 & 頁面規格](#4-網站地圖--頁面規格)
5. [資料庫 Schema 變更](#5-資料庫-schema-變更)
6. [開發階段規劃](#6-開發階段規劃)
7. [檔案結構變更](#7-檔案結構變更)
8. [環境變數清單](#8-環境變數清單)

---

## 1. 專案目標與限制

### 目標
- 從「販創所購物網站」升級為「比創空間三品牌官方網站」
- 三個子品牌獨立運作，各有專屬視覺色系與功能模組
- 後台 CMS 化：每月新增課程、作品集、商品不需碰程式碼
- 通知系統：訂單、報名、報價均發送 Email + Line 通知
- 金流預留：現階段手動轉帳，架構設計支援未來 ECPay/NewebPay 無縫接入

### 硬性限制
- 技術棧不變：React + Vite + TailwindCSS + Supabase
- 部署平台：Vercel（環境變數在 Vercel 介面管理）
- 通知機制：沿用現有 GAS Webhook → Email + Line Messaging API
- 舊商品連結無需保留（路由可自由重構）

---

## 2. 架構決策記錄 (ADR)

### ADR-001：購物車與訂單架構

**Status:** Accepted  
**問題：** 販創所需傳統購物車；鍛造工坊未來需「報價確認後線上結帳」；兩者是否共用同一套購物車？

**決策：分離 UI 流程，共用訂單與支付基礎設施**

| 品牌 | UX 流程 | 是否有傳統購物車 |
|------|---------|----------------|
| 販創所 | 瀏覽 → 加入購物車 → 結帳 → 訂單 | ✅ 有，多品項 |
| 鍛造工坊 | 填表 → 後台報價 → 客戶確認 → 單筆付款 | ❌ 沒有，是「報價接受」流程 |
| 創客世界 | 看課程 → 填報名表 → 完成 | ❌ 無金流（至少現階段） |

**共用部分（統一後台基礎設施）：**
```
販創所購物車      鍛造工坊報價確認
     ↓                   ↓
orderService.createOrder()  ← 共用，以 source 欄位區分
     ↓
paymentService.initiatePayment()  ← 共用支付抽象層
     ↓
GAS Webhook → Email + Line 通知
```

**Orders 表新增 `source` 欄位：**
- `'store'` = 販創所一般訂單
- `'forge'` = 鍛造工坊報價訂單

**理由：** 鍛造工坊的結帳不是「瀏覽式購物體驗」，而是單一報價確認付款，強行共用購物車 state 會造成架構汙染與 UX 混淆。但訂單資料結構和通知機制完全可以複用。

---

### ADR-002：金流系統設計（現在建架構，未來加 ECPay）

**Status:** Accepted  
**問題：** 現階段無第三方金流，但 1 年後可能加入。如何避免屆時大幅改動？

**決策：現在就建立 `paymentService.js` 抽象層，用介面隔離實作**

```
src/lib/paymentService.js       ← 現在建立，是唯一需要改動的檔案
```

**介面設計（現在就定義，實作先用手動轉帳）：**

```js
// paymentService.js

/**
 * 發起付款
 * 現在：回傳銀行轉帳資訊
 * 未來：redirect 到 ECPay / NewebPay，回傳付款頁 URL
 */
export async function initiatePayment({ orderId, amount, customerEmail }) {
  // Phase 1 (現在)：
  return {
    method: 'bank_transfer',
    instructions: { bank: '...', account: '...', amount }
  };
  // Phase 2 (未來，只改這裡)：
  // return { method: 'ecpay', redirectUrl: await createEcpayOrder(...) }
}

/**
 * 處理金流回呼（付款成功通知）
 * 現在：空實作（手動確認）
 * 未來：驗簽、更新訂單狀態
 */
export async function handlePaymentCallback(payload) {
  // Phase 2 實作
}
```

**加入 ECPay 時只需要：**
1. 修改 `paymentService.js` 的兩個函式實作
2. 新增 `/api/payment-callback` webhook endpoint（Vercel Edge Function）
3. 在 Supabase orders 表新增 `payment_status` 欄位（現在先建好）

**orders 表預留欄位（現在就加）：**
- `payment_method` (text) — `'bank_transfer'` / `'ecpay'` / `'neweb'`
- `payment_status` (text) — `'pending'` / `'paid'` / `'failed'`
- `payment_ref` (text) — 金流交易編號（現在留 null）

---

### ADR-003：子品牌路由隔離策略

**Status:** Accepted  
**問題：** 三個品牌功能差異大，路由如何設計才能清晰又不衝突？

**決策：以品牌名稱為路由前綴，各自隔離**

```
/                       比創空間品牌首頁（全新）
/about                  關於我們（重寫）
/store                  販創所落地頁
/store/products         商品列表（原 /）
/store/product/:id      商品詳情（原 /product/:id）
/store/cart             購物車（原 /cart）
/store/thank-you        感謝頁（原 /thank-you）
/forge                  鍛造工坊落地頁 + 服務說明 + 作品集 + 報價
/makerworld             創客世界落地頁 + 課程列表
/makerworld/:courseId   課程詳情 + 報名
/admin/*                後台（路由不變）
```

**Navbar 行為：**
- 所有頁面：顯示品牌主導航（販創所、鍛造工坊、創客世界、關於）
- 只在 `/store/*` 路由下：購物車圖示顯示並顯示數量
- 其他頁面：購物車圖示縮小或隱藏，避免干擾品牌體驗

---

## 3. 設計系統規格

### 色彩系統（從 LOGO 提取）

```css
/* 比創空間主品牌 */
--bcs-black:   #111111;   /* 主文字、強調 */
--bcs-white:   #FFFFFF;   /* 底色 */
--bcs-gray:    #F5F5F5;   /* 次要底色 */

/* 販創所（橘色系）*/
--store-500:   #EA580C;   /* 主色 */
--store-100:   #FFF3ED;   /* 淡背景 */
--store-700:   #C2410C;   /* hover */

/* 鍛造工坊（藍色系）*/
--forge-500:   #1D4ED8;   /* 主色 */
--forge-100:   #EFF6FF;   /* 淡背景 */
--forge-700:   #1E40AF;   /* hover */

/* 創客世界（綠色系）*/
--maker-500:   #16A34A;   /* 主色 */
--maker-100:   #F0FDF4;   /* 淡背景 */
--maker-700:   #15803D;   /* hover */
```

**移除：** 所有 `wood-*`、`muji-*`、`amber-*` 色系（從 tailwind.config.js 清除）

### 字型系統

```css
/* 保留 Noto Sans TC，新增顯示用字型 */
font-display: 'Noto Serif TC';   /* 大標題、品牌名稱 */
font-body:    'Noto Sans TC';    /* 內文、UI */
```

### 設計語言原則

1. **白底為主**，色彩作為強調，不作背景大面積使用
2. **間距充裕**，類似 Linear/Notion 的呼吸感
3. **卡片圓角** `rounded-2xl`（16px），一致規格
4. **動畫節制**：hover 位移 `-translate-y-1`，transition `200ms ease`
5. **移除木質感**：不再使用紋理、暖棕色、文青裝飾元素

---

## 4. 網站地圖 & 頁面規格

### 4.1 首頁 `/`（全新，最高優先）

**目的：** 品牌入口，讓訪客在 5 秒內理解「比創空間是什麼」並進入正確子品牌。

**區塊結構：**
```
[Navbar]
[Hero] ← 品牌宣言 + 3 行動按鈕（三品牌）
[三品牌卡片區] ← 各自色系、各自 CTA
[精選展示] ← 動態：最新商品 + 最新課程 + 最新作品
[品牌故事 Teaser] ← 簡短 2 句 → 連到 /about
[Footer]
```

### 4.2 關於我們 `/about`（重寫視覺）

內容保留現有文案，全面套用新設計系統，移除木質底色。

### 4.3 販創所 `/store`

**落地頁：** 品牌介紹 + 分類導覽 → 自動跳至 `/store/products`  
**商品列表 `/store/products`：**
- 分類 Tab：`[全部]` `[創作商品]` `[創客材料]`
- 商品卡片沿用現有設計，套用新色系

**後台影響：** AdminProducts 新增「商品分類」欄位選擇器（創作商品 / 創客材料）

### 4.4 鍛造工坊 `/forge`（改版）

**區塊結構：**
```
[Hero] ← 服務定位一句話
[服務說明] ← 雷切規格、3D列印材料、打樣顧問
[服務流程] ← 3 步驟圖示（填表 → 收到報價 → 確認製作）
[作品集 Gallery] ← 從 Supabase forge_portfolio 動態讀取
[報價表單] ← 現有 CustomQuote 功能移植
```

**後台新增：** AdminForgePortfolio（作品集管理：上傳圖片、標題、材料標籤）

### 4.5 創客世界 `/makerworld`（全新，最大功能量）

**落地頁 `/makerworld`：**
```
[Hero] ← 教育理念
[課程列表] ← 從 Supabase courses 動態讀取
  每張課程卡：封面圖、課程名、日期、名額/剩餘、報名按鈕
```

**課程詳情 `/makerworld/:courseId`：**
```
[課程封面大圖]
[課程資訊] ← 日期、時長、對象年齡、費用、剩餘名額
[課程描述]
[課堂照片 Gallery]
[報名表單]
  → 家長姓名、聯絡電話、Email、孩童年齡、備注
  → 送出後：寫入 registrations 表 + GAS Webhook 通知
```

**後台新增：**
- `AdminCourses`：新增/編輯/刪除課程、上傳封面圖與課堂照片
- `AdminRegistrations`：查看報名名單、出席標記、匯出

---

## 5. 資料庫 Schema 變更

### 5.1 現有表修改

**`orders` 表新增欄位：**
```sql
ALTER TABLE orders ADD COLUMN source TEXT DEFAULT 'store';
  -- 'store' | 'forge'
ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'bank_transfer';
  -- 'bank_transfer' | 'ecpay' | 'neweb'
ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
  -- 'pending' | 'paid' | 'failed'
ALTER TABLE orders ADD COLUMN payment_ref TEXT;
  -- 金流交易編號，現階段為 null
```

**`products` 表新增欄位：**
```sql
ALTER TABLE products ADD COLUMN category TEXT DEFAULT 'creative';
  -- 'creative'（創作商品）| 'materials'（創客材料）
```

### 5.2 新增表

**`courses`（創客世界課程）：**
```sql
CREATE TABLE courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  cover_url     TEXT,
  gallery_urls  TEXT[],          -- 課堂照片陣列
  date          TIMESTAMPTZ NOT NULL,
  duration_min  INTEGER DEFAULT 120,
  min_age       INTEGER,
  max_age       INTEGER,
  capacity      INTEGER DEFAULT 10,
  enrolled      INTEGER DEFAULT 0,
  price         INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'open', -- 'open' | 'full' | 'closed'
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

**`registrations`（課程報名）：**
```sql
CREATE TABLE registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID REFERENCES courses(id) ON DELETE CASCADE,
  parent_name   TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  child_age     INTEGER,
  note          TEXT,
  status        TEXT DEFAULT 'confirmed', -- 'confirmed' | 'attended' | 'absent' | 'cancelled'
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

**`forge_portfolio`（鍛造工坊作品集）：**
```sql
CREATE TABLE forge_portfolio (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT NOT NULL,
  material      TEXT,            -- '雷射切割' | '3D列印' | '複合'
  tags          TEXT[],
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### 5.3 RLS 政策（Row Level Security）

```sql
-- courses：公開可讀，只有認證用戶可寫
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON courses FOR SELECT USING (true);
CREATE POLICY "admin write" ON courses FOR ALL USING (auth.role() = 'authenticated');

-- registrations：只有認證用戶可讀寫
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin only" ON registrations FOR ALL USING (auth.role() = 'authenticated');

-- forge_portfolio：公開可讀，只有認證用戶可寫
ALTER TABLE forge_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON forge_portfolio FOR SELECT USING (true);
CREATE POLICY "admin write" ON forge_portfolio FOR ALL USING (auth.role() = 'authenticated');
```

---

## 6. 開發階段規劃

### Phase 0：設計系統重構（前置，阻斷其他工作）
> 這個 Phase 影響所有後續頁面，必須先完成。

- [x] 更新 `tailwind.config.js`：移除 `wood`/`muji`/`amber`，加入三品牌色系
- [x] 更新 `index.css`：調整全域字型與底色，新增 `.card`、`.btn-*`、`.badge-*` 共用 class
- [x] 建立 `src/lib/paymentService.js`：支付抽象層（Phase 1 銀行轉帳 + Phase 2 預留介面）
- [x] 建立 `supabase/migrations/20260416_bcs_rewrite.sql`：orders/products 欄位擴充 + courses/registrations/forge_portfolio 三新表

**預估工作量：** 半天

---

### Phase 1：首頁 + Navbar 重構（第一印象）
> 完成後網站從購物網站變成品牌網站。

- [x] 重構 `Navbar.jsx`：品牌導向，購物車只在 `/store/*` 顯眼顯示
- [x] 新建 `src/pages/Home.jsx`：品牌首頁
- [x] 更新 `App.jsx`：路由重構（`/store/*` 前綴）
- [x] 更新 `AboutUs.jsx`：套用新設計系統

**路由變更對照：**
```
原路由              新路由
/              →   /store/products  (redirect)
/product/:id   →   /store/product/:id
/cart          →   /store/cart
/thank-you     →   /store/thank-you
/about         →   /about  (不變)
/quote         →   /forge  (整合進落地頁)
```

**預估工作量：** 1–2 天

---

### Phase 2：創客世界（最大新功能）
> 每月都要更新課程，優先讓後台 CMS 上線。

**後台先行：**
- [x] Supabase Migration：建立 `courses` 和 `registrations` 表（已隨 20260416_bcs_rewrite.sql 部署）
- [x] 新建 `src/pages/admin/AdminCourses.jsx`：課程管理（含圖片上傳）
- [x] 新建 `src/pages/admin/AdminRegistrations.jsx`：報名管理
- [x] 更新 `AdminLayout.jsx`：新增側選單項目

**前台：**
- [x] 新建 `src/pages/MakerWorld.jsx`：課程列表頁
- [x] 新建 `src/pages/CourseDetail.jsx`：課程詳情 + 報名表單
- [x] 新建 `src/lib/courseService.js`：課程 CRUD
- [x] 新建 `src/lib/registrationService.js`：報名邏輯 + GAS Webhook 通知
- [x] 更新 `App.jsx`：加入 `/makerworld` 路由

**GAS Webhook 擴充：**
- 報名通知 payload 格式：`{ type: 'registration', course, parent, phone, email }`
- 後端 GAS 腳本需新增 `registration` 分支處理（請自行在 GAS 後台更新腳本）

**預估工作量：** 2–3 天

---

### Phase 3：販創所強化
> 在現有購物系統上新增分類功能，影響最小。

- [x] AdminProducts 新增 `category` 欄位（下拉選擇）
- [x] `ProductGallery` 改版為 `/store/products`，加入 Tab 篩選
- [x] 新建 `src/pages/Store.jsx`：販創所品牌落地頁
- [x] 套用新設計系統（橘色系強調）

**預估工作量：** 1 天

---

### Phase 4：鍛造工坊改版
> 服務型頁面，重點在作品集與流程說明。

- [x] Supabase Migration：建立 `forge_portfolio` 表（已隨 20260416_bcs_rewrite.sql 部署）
- [x] 新建 `src/pages/Forge.jsx`：整合落地頁 + 服務說明 + 作品集 + 報價表單
- [x] 新建 `src/pages/admin/AdminForgePortfolio.jsx`：作品集管理
- [x] 現有 `CustomQuote.jsx` 邏輯移植至 `Forge.jsx` 中的 section

**預估工作量：** 1 天

---

### Phase 5：收尾與品質優化
- [x] SEO：每頁加入 `<title>` 和 `<meta description>`（usePageMeta hook）
- [x] Loading State：統一 skeleton 樣式（Skeleton.jsx：SkeletonCourseCard、SkeletonPortfolioGrid、SkeletonProductCard）
- [x] Mobile 全面檢測（Forge 尺寸輸入改 `sm:grid-cols-3`）
- [x] Footer：加入聯絡資訊、三品牌快捷連結、IG / 蝦皮連結
- [x] `notification_failures` 後台查詢（AdminNotificationFailures.jsx）

**預估工作量：** 1 天

---

### Phase 6：綠界物流整合（C2C 賣貨便 + 黑貓 + 中華郵政）

**動機：** 目前 `CustomerInfo.jsx` 的超商選店是外部連結 → 手動複製貼上，UX 不佳。整合綠界物流後達成「選店自動帶回 + 付款後自動建立物流單 + 即時追蹤 + LINE 推播」。

**先決條件（已完成）：**
- [x] 綠界物流代辦服務開通（比創空間獨資，統編 94320625）
- [x] 取得 MerchantID + HashKey + HashIV
- [x] 安裝綠界 AI Skill（`~/.claude/skills/ecpay`）

**範圍決策：**
- 物流類型：**C2C 賣貨便**（自送 7-11 / 全家 / 萊爾富 / OK，6 個月內出貨量小）
- 一併整合**黑貓宅配 + 中華郵政**（取代現有手填地址流程）
- 狀態變更觸發 **LINE Messaging API** 推播

#### Phase 6.0 — 環境變數 + DB schema
- [x] Vercel 新增環境變數：
  - `ECPAY_LOGISTICS_MERCHANT_ID`
  - `ECPAY_LOGISTICS_HASH_KEY`
  - `ECPAY_LOGISTICS_HASH_IV`
  - `ECPAY_LOGISTICS_BASE_URL`（測試 `https://logistics-stage.ecpay.com.tw`，正式 `https://logistics.ecpay.com.tw`）
  - `VITE_LOGISTICS_REPLY_URL`（前端 callback 接點 = `https://bcs.tw/api/logistics/select-store-callback`）
- [x] Supabase migration：`orders` 表新增欄位（SQL 已執行，11 欄 + idx_orders_logistics_id）
  - `cvs_store_id` text — 超商店號
  - `cvs_store_name` text — 超商店名
  - `cvs_store_brand` text — `UNIMARTC2C` / `FAMIC2C` / `HILIFEC2C` / `OKMARTC2C`
  - `cvs_store_address` text
  - `logistics_id` text — 綠界物流訂單編號
  - `logistics_sub_type` text — `UNIMARTC2C` / `FAMIC2C` / `TCAT` / `POST`
  - `logistics_status` text — 對應綠界物流狀態碼
  - `logistics_status_at` timestamptz
  - `logistics_message` text
  - `shipment_no` text — 賣貨便寄件代碼 / 黑貓託運單號 / 郵政掛號號碼
  - `payment_no` text — 賣貨便繳款代碼（C2C 才有）

#### Phase 6.1 — 後端 Serverless Functions（`api/logistics/`）
- [x] `_lib/check-mac.js` — CheckMacValue 計算（已過 ecpay skill 7/7 test-vectors）
- [x] `_lib/ecpay-client.js` — buildPayload / buildAutoSubmitForm / postLogistics / parseEcpayResponse
- [x] `_lib/create-order-core.js` — 共用建單核心（給 LINE Pay confirm 直接 import）
- [x] `select-store.js` — 產生綠界選店 form HTML（auto-submit）
- [x] `select-store-callback.js` — 接綠界 POST，302 redirect 回 `/store/cart` 帶 query string
- [x] `create-order.js` — C2C / TCAT / POST 三分支，admin 觸發
- [x] `query-status.js` — 公開 endpoint，supports cache + refresh
- [x] `status-webhook.js` — CMV 驗證 + 永遠回 `1|OK` 防綠界重送風暴
- [x] `print-document.js` — C2C 用 brand-specific endpoint，HOME 用 `/helper/printTradeDocument`

#### Phase 6.2 — 前端：選店與運送方式（`CustomerInfo.jsx`）
- [x] `ShippingMethodSelector.jsx` 重構：超商店到店 / 黑貓 / 郵政 / 自取
- [x] `CustomerInfo.jsx` 兩個外部連結 → 「選擇超商門市」按鈕（form POST 到 `/api/logistics/select-store`，含 brand 下拉）
- [x] 新增 `useLogisticsStore.js` hook：URL query → sessionStorage → React state，自動移除網址參數
- [x] 已選門市改顯示卡片（Brand + 店名 + 店號 + 地址 + 重新選擇）
- [x] 黑貓 / 郵政新增 `zipCode` 欄位（綠界 HOME 必填）
- [x] `App.jsx` 新增 `cvsStore*` / `zipCode` defaults + onSuccess 重置
- [x] `useOrderSubmit.js` + `orderService.js`：寫入 `logistics_sub_type` / `cvs_store_*` 欄位
- [x] `npm run build` 通過，無 syntax error

#### Phase 6.3 — 物流訂單自動建立
- [x] `_lib/create-order-core.js` 加 `tryAutoCreateLogistics`（自取自動跳過、失敗寫 `notification_failures`）
- [x] LINE Pay `confirm.js` 在付款成功後直接呼叫，不影響付款結果
- [x] AdminOrders `updateOrderStatus(id, 'paid')` 觸發 `/api/logistics/create-order`（帶 Bearer token）
- [x] 自取訂單 / 已建單訂單自動跳過

#### Phase 6.4 — 物流追蹤（`ThankYouPage.jsx` + `PaymentConfirmPage.jsx`）
- [x] 新增 `<LogisticsTracking>` 元件（src/components/LogisticsTracking.jsx）
- [x] 載入時 first-fetch（cache）+ 每 30s polling `/api/logistics/query-status?refresh=true`
- [x] Timeline 顯示（簡化為 4 個關鍵節點，避免太雜亂）：
  - **C2C**：訂單建立 → 已寄件 → 已到取件門市 → 已取貨
  - **黑貓**：訂單建立 → 已取件 → 配送中 → 已送達
  - **郵政**：訂單建立 → 已交寄 → 投遞中 → 已投遞
- [x] 物流單號 + 繳款代碼（C2C）+ 取件門市 + 對應品牌官網查詢連結
- [x] 已掛載到 `ThankYouPage.jsx`（銀行轉帳完成頁）和 `PaymentConfirmPage.jsx`（LINE Pay 確認頁）

#### Phase 6.5 — 後台（`AdminOrders.jsx`）
- [x] 訂單列「訂單編號」欄位下方新增物流標籤：物流方式 + 託運編號 + 最新訊息
- [x] 詳情 Modal 新增「綠界物流」區塊：物流方式 / 託運編號 / 繳款代碼（C2C）/ 取件門市 / 狀態碼 / 訊息 + 時間
- [x] 「列印託運單」按鈕：POST `/api/logistics/print-document`（admin Bearer），用 Blob URL 開新視窗
- [x] 「強制刷新狀態」按鈕：GET `/api/logistics/query-status?refresh=true`，更新本地 state
- [x] 修正 legacy `'pickup' ? '自取' : '郵寄'` 顯示 → 4 種運送方式 label dict
- [x] 詳情頁加上 zipCode 顯示 + pickup 門市/時段

#### Phase 6.6 — LINE 通知整合
- [x] `status-webhook.js` payload 擴充：subType / shipmentNo / paymentNo / storeAddress / customer.email
- [x] GAS V6：新增 `logistics_status` case + `classifyLogisticsStatus` 將 RtnCode 對應 5 種里程碑（created/shipped/inTransit/arrived/delivered）
- [x] GAS V6：`createLogisticsStatusFlex` admin LINE 通知（含品牌、狀態、託運單號、取件門市、客戶資訊）
- [x] GAS V6：`sendLogisticsStatusEmail` 客戶里程碑信件（僅 shipped / arrived / delivered 觸發；arrived 包含取件門市卡片）
- [x] 新增 `/store/track?orderId=...` 路由 + `TrackOrderPage`（信件 CTA 連到此頁）
- [x] 訂購確認信（bank transfer + LINE Pay）加入「📦 查看物流追蹤」CTA 按鈕
- [x] GAS Script Property `BCS_BASE_URL` 預設 `https://bcs.tw`，可依環境覆寫

#### Phase 6.7 — 測試 + 切正式（**需使用者手動執行**）
- [x] CheckMacValue 已在 Phase 6.1 驗證（ecpay skill 7/7 test-vectors）
- [x] 程式碼路徑全建立：`npm run build` 通過、所有 API endpoint 可載入
- [ ] **使用者：** Vercel 上設定 `BCS_BASE_URL`（GAS Script Property，非 Vercel env）→ `https://bcs.tw`
- [ ] **使用者：** sandbox 環境下單測試三種物流類型：
  - C2C 7-11 賣貨便：選店 → 下單 → admin 確認入帳 → 收到託運單 PDF + 繳款代碼
  - 黑貓宅配：填地址 + zipCode → 下單 → admin 確認入帳 → 黑貓託運單
  - 中華郵政：填地址 + zipCode → 下單 → admin 確認入帳 → 郵政託運單
- [ ] **使用者：** 綠界廠商後台手動觸發狀態變更（已寄出 / 到店 / 已取貨）→ 驗證：
  - 狀態 webhook 收到並更新 DB
  - admin LINE 收到 logistics_status Flex
  - 客戶於關鍵里程碑收到 email（含取件門市卡片）
  - 客戶 `/store/track?orderId=...` 與 ThankYouPage 自動更新（30s polling）
- [ ] **使用者：** AdminOrders「列印託運單」按鈕測試（C2C 應走品牌專屬端點，HOME 走 `/helper/printTradeDocument`）
- [ ] **使用者：** 確認綠界正式 MerchantID 同時支援 C2C 賣貨便 + B2C 黑貓/郵政
  - ⚠️ **若不支援單一 MerchantID 同時掛 2 種物流，需拆分：**
    - 一組 env：`ECPAY_LOGISTICS_C2C_*`（C2C 賣貨便用 2000933 / 對應 HashKey/IV）
    - 一組 env：`ECPAY_LOGISTICS_HOME_*`（B2C 黑貓/郵政用 2000132 / 對應 HashKey/IV）
    - 程式需改 `getLogisticsEnv` 依 subType 分支選擇 env，現未實作
- [ ] **使用者：** 小量正式單實測（建議先用一筆自家測試訂單）
- [ ] **使用者：** Vercel env `ECPAY_LOGISTICS_BASE_URL` → `https://logistics.ecpay.com.tw`

**預估工作量：** 3 天

---

## 7. 檔案結構變更

```
src/
├── pages/
│   ├── Home.jsx                  NEW  比創空間首頁
│   ├── AboutUs.jsx               MOD  套用新設計系統
│   ├── Store.jsx                 NEW  販創所落地頁
│   ├── Forge.jsx                 NEW  鍛造工坊（取代 CustomQuote.jsx）
│   ├── MakerWorld.jsx            NEW  創客世界課程列表
│   ├── CourseDetail.jsx          NEW  課程詳情 + 報名
│   └── admin/
│       ├── AdminCourses.jsx      NEW  課程管理
│       ├── AdminRegistrations.jsx NEW  報名管理
│       ├── AdminForgePortfolio.jsx NEW  作品集管理
│       ├── AdminOrders.jsx       MOD  新增 source/payment 欄位顯示
│       └── AdminProducts.jsx     MOD  新增 category 欄位
├── lib/
│   ├── paymentService.js         NEW  支付抽象層
│   ├── courseService.js          NEW  課程 CRUD
│   └── registrationService.js   NEW  報名邏輯
├── components/
│   ├── Navbar.jsx               MOD  品牌導向重構
│   ├── Footer.jsx               NEW  全站 Footer
│   └── ProductGallery.jsx       MOD  加入 Tab 篩選
└── App.jsx                      MOD  路由重構
```

**可刪除：**
- `src/pages/CustomQuote.jsx` → 邏輯移入 `Forge.jsx`

---

## 8. 環境變數清單

**現有（Vercel 已設定，不動）：**
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_GAS_WEBHOOK_URL
```

**Phase 6 物流整合需新增（後端用，Vercel Serverless）：**
```
ECPAY_LOGISTICS_MERCHANT_ID
ECPAY_LOGISTICS_HASH_KEY
ECPAY_LOGISTICS_HASH_IV
ECPAY_LOGISTICS_BASE_URL    (測試: https://logistics-stage.ecpay.com.tw / 正式: https://logistics.ecpay.com.tw)
VITE_LOGISTICS_REPLY_URL    (前端 callback 接點，例如 https://bcs.tw/api/logistics/select-store-callback)
```

**未來加入 ECPay 金流時需新增：**
```
ECPAY_PAYMENT_MERCHANT_ID
ECPAY_PAYMENT_HASH_KEY
ECPAY_PAYMENT_HASH_IV
ECPAY_PAYMENT_RETURN_URL
```

---

## 附錄：GAS Webhook Payload 格式規範

### 訂單通知（現有，source 新增）
```json
{
  "type": "order",
  "source": "store",
  "orderId": "BCS-XXXXXX",
  "customerName": "...",
  "total": 999
}
```

### 課程報名通知（新增）
```json
{
  "type": "registration",
  "courseTitle": "Arduino 初學班",
  "courseDate": "2026-05-10",
  "parentName": "...",
  "phone": "09XX-XXX-XXX",
  "email": "...",
  "childAge": 10,
  "note": "..."
}
```

### 鍛造工坊報價通知（現有格式，確認不變）
```json
{
  "type": "quote",
  "customerName": "...",
  "phone": "...",
  "material": "...",
  "description": "..."
}
```

---

*本文件隨實作進度持續更新。*
