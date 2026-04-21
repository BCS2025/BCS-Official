# LINE Pay 整合設定手冊

本手冊說明「販創所」結帳頁面 LINE Pay 線上付款的設定、測試、上線流程。

---

## 一、前置作業

### 1.1 準備帳號
- **LINE Pay Merchant Center**：已通過合作廠商審核，取得 `Channel ID` 與 `Channel Secret`。
- **Supabase 專案**：現有專案，`orders` 表已預留 `payment_method / payment_status / payment_ref / paid_at` 欄位。
- **Vercel 專案**：部署生產站點。

### 1.2 取得 LINE Pay 金鑰
1. 登入 [LINE Pay Merchant Center](https://pay.line.me/tw/login/)
2. 進入「管理商店 → 付款連結管理 → API 開發資訊」
3. 切換到「**沙盒測試環境**」頁籤（先用 sandbox 測通）
4. 複製 **Channel ID** 與 **Channel Secret**

---

## 二、Vercel 環境變數設定

到 Vercel Dashboard → 專案 → Settings → Environment Variables 新增：

| 變數 | Scope | 說明 |
|------|-------|------|
| `LINE_PAY_CHANNEL_ID` | Production + Preview + Development | LINE Pay Channel ID |
| `LINE_PAY_CHANNEL_SECRET` | Production + Preview + Development | LINE Pay Channel Secret（**機密，勿外流**）|
| `LINE_PAY_API_BASE` | 測試先填 `https://sandbox-api-pay.line.me`；正式改 `https://api-pay.line.me` | API 基底網址 |
| `VITE_SITE_URL` | Production 填正式網址，Preview 可填 Vercel 預覽網址 | LINE Pay redirect 回跳用 |
| `VITE_PAYMENT_BANK_NAME` | All | 轉帳銀行名稱（例：`中華郵政 (700)`）|
| `VITE_PAYMENT_ACCOUNT` | All | 轉帳帳號 |
| `VITE_PAYMENT_ACCOUNT_NAME` | All | 戶名 |

設定完後**必須重新部署一次**才會生效。

---

## 三、沙盒測試流程

### 3.1 LINE Pay Sandbox 測試帳號
- 在 Merchant Center 的「沙盒測試環境」頁面下載 **LINE Pay Sandbox App**（Android / iOS）
- 或使用網頁版 sandbox 測試帳號（Merchant Center 頁面內會提供 QR Code）

### 3.2 下單測試步驟
1. 前往 `https://<你的網址>/store/products`，加商品進購物車
2. 填寫客戶資料，在「付款方式」選 **LINE Pay**
3. 點「送出並前往 LINE Pay」→ 系統會：
   - 把訂單寫入 Supabase（`payment_method='line_pay'`、`payment_status='pending'`）
   - 發第一次 GAS 通知（`order_notify`）
   - 導向 LINE Pay 沙盒付款頁
4. 用沙盒帳號完成付款 → 回跳 `/store/payment/confirm`
5. 前端自動呼叫 `/api/linepay/confirm` → 成功後：
   - 更新訂單 `status='paid'`、`payment_status='paid'`、`paid_at`、`payment_ref=交易ID`
   - 發第二次 GAS 通知（`payment_confirm`）
6. 顯示「LINE Pay 付款成功」畫面

### 3.3 失敗／取消情境
- 付款頁點「取消」→ 導向 `/store/payment/cancel`，訂單保留在 `pending`
- Confirm API 失敗 → 顯示錯誤頁，訂單 `payment_status='failed'`（可透過客服補處理）

---

## 四、退款流程（後台）

1. 管理員登入 Admin → 訂單管理
2. 點「詳情」打開訂單 modal
3. 若訂單 `payment_method='line_pay'` 且 `payment_status='paid'`，底部會出現紅色「LINE Pay 退款」按鈕
4. 點擊後：
   - 彈窗詢問退款金額（預設 = 訂單總額）
   - 留空或等於原金額 = **全額退款**，訂單狀態會改為 `cancelled`
   - 輸入較小金額 = **部分退款**，訂單狀態保持但 `payment_status='partial_refunded'`
5. `admin_notes` 會自動附上退款紀錄（含執行者、時間、退款交易編號）
6. 同步發 GAS 通知（`payment_refund`）

---

## 五、切換到正式環境

1. Merchant Center 申請「正式環境」的 `Channel ID` / `Channel Secret`（如果 sandbox 用的是 dummy）
2. Vercel 環境變數：
   - `LINE_PAY_CHANNEL_ID` / `LINE_PAY_CHANNEL_SECRET` 換成正式版
   - `LINE_PAY_API_BASE` 改為 `https://api-pay.line.me`
3. 重新部署
4. 跑一筆小額真實訂單驗證流程
5. 測通後即可對外開放

---

## 六、GAS Webhook 通知類型

GAS script 需要可以識別以下 `type`：

| type | 觸發時機 | 用途 |
|------|---------|------|
| `order_notify`（現有）| 訂單建立時 | 通知賣家有新訂單 |
| `payment_confirmed` | LINE Pay 付款成功 | 通知賣家可開始製作 |
| `payment_refunded` | 後台執行退款 | 存證／通知客人 |
| `low_stock_alert`（現有）| 庫存低於安全量 | 通知補料 |

若現有 GAS 只 log 訂單內容，新增的 `payment_confirmed` 與 `payment_refunded` 可用同樣格式處理，或拆分寄不同主旨 Email。

---

## 七、常見問題

**Q：LINE Pay 付款後使用者關閉瀏覽器、沒回跳怎麼辦？**
A：訂單會卡在 `payment_status='pending'`。後續可建排程（Cron）每日呼叫 LINE Pay `check-payment-request-status` API 比對，或由客服透過後台手動標記。

**Q：為什麼要後端驗金額？**
A：LINE Pay Confirm API 要傳 amount。若前端自由帶，惡意使用者可竄改金額偷付便宜款。因此後端 `/api/linepay/confirm` 從 Supabase 重新讀 `total_amount`，不信任前端。

**Q：Channel Secret 會外流嗎？**
A：不會。所有用到 Secret 的程式碼都在 `api/linepay/*.js`（Vercel Serverless Function 後端執行），前端 bundle 不含 Secret。`.env` 檔已被 `.gitignore`，`.env.example` 只放佔位字串。
