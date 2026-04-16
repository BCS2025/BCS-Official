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

- [ ] Supabase Migration：建立 `forge_portfolio` 表
- [ ] 新建 `src/pages/Forge.jsx`：整合落地頁 + 服務說明 + 作品集 + 報價表單
- [ ] 新建 `src/pages/admin/AdminForgePortfolio.jsx`：作品集管理
- [ ] 現有 `CustomQuote.jsx` 邏輯移植至 `Forge.jsx` 中的 section

**預估工作量：** 1 天

---

### Phase 5：收尾與品質優化
- [ ] SEO：每頁加入 `<title>` 和 `<meta description>`
- [ ] Loading State：統一 skeleton 樣式
- [ ] Mobile 全面檢測（Navbar、課程卡、報名表單）
- [ ] Footer：加入聯絡資訊、三品牌快捷連結、IG / 蝦皮連結
- [ ] `notification_failures` 後台查詢（已有表，需加入管理介面）

**預估工作量：** 1 天

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

**未來加入 ECPay 時需新增：**
```
VITE_ECPAY_MERCHANT_ID
VITE_ECPAY_HASH_KEY
VITE_ECPAY_HASH_IV
ECPAY_RETURN_URL          (後端用，Vercel Edge Function)
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
