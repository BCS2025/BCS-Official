# 比創空間 客製化訂單網站

**比創空間 (BCS)** 的客製化商品電商平台，支援木質鑰匙圈、壓克力燈、雷切雷雕等客製化商品的線上接單與管理。

- **網站**：[bcs.tw](https://bcs.tw)
- **管理後台**：[bcs.tw/admin](https://bcs.tw/admin)
- **部署平台**：Vercel

---

## 技術架構

| 層 | 技術 |
|----|------|
| 前端 | React 19 + Vite + Tailwind CSS |
| 後端 / DB | Supabase (PostgreSQL + Auth + Storage) |
| 通知 | Google Apps Script Webhook → Email + LINE |
| 部署 | Vercel (Auto Deploy from GitHub main branch) |
| 分析 | Vercel Analytics + Speed Insights |

---

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 執行測試
npm test

# 建置生產版本
npm run build
```

### 環境變數

複製 `.env.example` 為 `.env` 並填入以下變數：

```
VITE_SUPABASE_URL=           # Supabase Project URL
VITE_SUPABASE_ANON_KEY=      # Supabase Anon Key (公開)
SUPABASE_SERVICE_ROLE_KEY=   # Supabase Service Role Key (僅 scripts 用，勿提交)
VITE_GAS_WEBHOOK_URL=        # Google Apps Script Webhook URL
```

---

## 專案結構

```
src/
├── App.jsx                  # 路由與全域狀態
├── components/              # UI 元件
│   ├── admin/               # 後台元件 (AdminLayout, ConfigSchemaBuilder)
│   ├── ui/                  # 基礎 UI 元件 (Button, Input, Select...)
│   └── ...                  # 前台功能元件 (Cart, ProductDetail...)
├── pages/
│   ├── admin/               # 後台頁面 (Orders, Products, Coupons, Inventory...)
│   ├── AboutUs.jsx
│   └── CustomQuote.jsx
├── hooks/                   # useCart, useOrderSubmit
├── lib/                     # 服務層 (supabase, orderService, couponService...)
├── data/                    # 靜態商品資料 (Legacy fallback)
└── __tests__/               # Vitest 測試
```

---

## 前台路由

| 路徑 | 說明 |
|------|------|
| `/` | 首頁商品列表 |
| `/product/:id` | 商品詳情與規格選擇 |
| `/cart` | 購物車 + 結帳 |
| `/thank-you` | 下單成功頁 |
| `/about` | 關於我們 |
| `/quote` | 客製報價申請 |

## 後台路由（需登入）

| 路徑 | 說明 |
|------|------|
| `/admin/orders` | 訂單管理 |
| `/admin/products` | 商品 CRUD |
| `/admin/coupons` | 優惠券管理 |
| `/admin/inventory` | 原料庫存管理 |
| `/admin/quote-materials` | 報價材質管理 |

---

## 日常維運

詳細操作流程請參閱 **[SOP.md](./SOP.md)**。

---

## 部署

Push 到 `main` branch 後 Vercel 自動部署。環境變數在 Vercel 專案設定中管理。
