# Phase 6 綠界物流整合 — 完整測試計畫

> **適用版本：** Phase 6.0–6.6 程式碼完成（尚未 push）
> **目標：** 驗證程式碼正確性、找出邏輯漏洞，再決定是否 push + 切正式
> **預估時間：** 4–6 小時（不含等待綠界後台同步）
> **執行方式：** 在新 session 中由上而下逐項打勾

---

## 0. 測試前置作業（30 分鐘）

### 0.1 環境變數確認

#### Vercel（Production + Preview）
打開 [Vercel Dashboard](https://vercel.com/) → Project Settings → Environment Variables，確認以下都存在：

| 變數名稱 | 內容（**Sandbox**） | 是否必填 |
|---------|--------------------|----------|
| `ECPAY_LOGISTICS_MERCHANT_ID` | 綠界提供的測試 MerchantID | ✅ |
| `ECPAY_LOGISTICS_HASH_KEY` | 綠界提供的測試 HashKey | ✅ |
| `ECPAY_LOGISTICS_HASH_IV` | 綠界提供的測試 HashIV | ✅ |
| `ECPAY_LOGISTICS_BASE_URL` | `https://logistics-stage.ecpay.com.tw` | ✅ |
| `VITE_LOGISTICS_REPLY_URL` | （**選填**）不設則自動由 request host 推導 | 選填 |
| `VITE_LOGISTICS_STATUS_WEBHOOK_URL` | （**選填**）不設則自動由 request host 推導 | 選填 |
| `VITE_SITE_URL` | `https://bcs.tw` | ✅ |
| `ECPAY_LOGISTICS_SENDER_NAME` | `比創空間`（預設） | 建議顯式設 |
| `ECPAY_LOGISTICS_SENDER_CELLPHONE` | 寄件人手機（10 碼，09開頭） | ✅ |
| `ECPAY_LOGISTICS_SENDER_PHONE` | 寄件人市話（可選） | 選填 |
| `ECPAY_LOGISTICS_SENDER_ZIP` | `710` | 預設 ok |
| `ECPAY_LOGISTICS_SENDER_ADDRESS` | 永康區地址 | 預設 ok |

- [ ] 全部變數已設置
- [ ] **Preview 環境**也有設置（部署在 preview 才能測 sandbox）

#### GAS Script Properties
打開 GAS Script → 專案設定 → 指令碼屬性，確認：
- [ ] `LINE_CHANNEL_ACCESS_TOKEN` 有值
- [ ] `LINE_USER_ID` 有值（admin 自己的 LINE userId）
- [ ] **新增** `BCS_BASE_URL` = `https://bcs.tw`（本次新加）

### 0.2 Supabase migration 套用驗證

到 Supabase Dashboard → SQL Editor，執行：

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN (
    'logistics_id', 'logistics_sub_type', 'logistics_status',
    'logistics_status_at', 'logistics_message',
    'shipment_no', 'payment_no',
    'cvs_store_id', 'cvs_store_name', 'cvs_store_address', 'cvs_store_brand'
  )
ORDER BY column_name;
```

**預期：** 11 row 全部出現
- [ ] 11 個欄位全存在

### 0.3 GAS V6 部署

開 [google_script_v2.js](google_script_v2.js)，把整支內容複製貼上到 GAS 編輯器 → 部署 → 新增部署 → 類型「網路應用程式」→ 執行身分自己 / 任何人皆可存取。

- [ ] 部署成功，URL 與 `VITE_GAS_WEBHOOK_URL` 相同（不變則不需重新部署）
- [ ] 在 GAS 編輯器執行 `testLine()`，自己 LINE 收到「測試成功」訊息

### 0.4 Build 與部署狀態

```bash
npm run build
```

- [ ] Build 成功，無 error
- [ ] Push 到 git（**先不要 push！** 此步驟在所有測試通過後做）
- [ ] 部署到 Vercel preview（push 後自動觸發）

### 0.5 測試帳號準備

- [ ] 準備 admin Supabase 帳號（已可登入 `/admin`）
- [ ] 準備一個測試用 email（看 email 通知，不要用真實客戶 email）
- [ ] 準備一支可收 SMS 的手機（綠界選店有時需簡訊驗證；現在 sandbox 不需要，但備著）
- [ ] LINE Pay sandbox：測試帳號（手機: 0000000001 或綠界提供的測試帳）

---

## 1. Pre-flight 自動化檢查（10 分鐘）

### 1.1 本機 build & 模組載入

```bash
cd CustomizedProductWebsite
npm run build
```
- [ ] Build 通過，無 syntax error

```bash
node --input-type=module -e "import('./api/logistics/status-webhook.js').then(() => console.log('OK'))"
node --input-type=module -e "import('./api/logistics/create-order.js').then(() => console.log('OK'))"
node --input-type=module -e "import('./api/logistics/print-document.js').then(() => console.log('OK'))"
node --input-type=module -e "import('./api/logistics/query-status.js').then(() => console.log('OK'))"
```
- [ ] 4 個 endpoint 都印 OK

### 1.2 CheckMacValue 已通過 test-vectors

Phase 6.1 已驗證 7/7（在綠界 ecpay skill 的 test-vectors 下）。
- [ ] 跳過（已通過）

### 1.3 Vercel deploy 健康檢查

部署到 preview 後，curl：

```bash
curl -i https://<preview-url>/api/logistics/query-status?orderId=NOT_EXIST
```
- [ ] 回 200 + `{"error":"訂單不存在"}` 或類似（**重點：不能 500**，500 代表 env 沒讀到）

```bash
curl -i -X POST https://<preview-url>/api/logistics/create-order \
  -H "Content-Type: application/json" -d '{"orderId":"X"}'
```
- [ ] 回 401「缺少授權 Token」（admin 驗證有作用）

---

## 2. 前端 UI 行為測試（30 分鐘）

到 preview 環境 `/store/products` 加商品到購物車，進 `/store/cart`。

### 2.1 4 種運送方式可見且可切換
- [ ] 看到 4 個按鈕：超商店到店 / 黑貓宅配 / 中華郵政 / 自取
- [ ] 桌機版 4 欄並排，手機版 2 欄
- [ ] 切換時運費自動更新（60 / 180 / 80 / 0）

### 2.2 超商店到店：選店流程

點選「超商店到店」：
- [ ] 顯示「選擇取件門市」按鈕 + 品牌下拉（7-11 / 全家 / 萊爾富 / OK）

選 7-11 → 點「選擇取件門市」：
- [ ] 跳到綠界 sandbox 選店頁（網址含 `logistics-stage.ecpay.com.tw`）
- [ ] 隨意選一家門市 → 自動 redirect 回 `/store/cart?cvs_store_id=...&cvs_store_name=...`

回到購物車：
- [ ] 看到「已選門市」卡片，顯示品牌 + 店名 + 店號 + 地址
- [ ] URL 上的 `cvs_store_*` 參數已被移除（檢查網址列）
- [ ] 重新整理頁面門市資訊不消失（sessionStorage 還在）
- [ ] 點「重新選擇」→ 卡片消失，可重新選

切換到「黑貓宅配」再回到「超商店到店」：
- [ ] 已選的門市資訊仍保留

### 2.3 黑貓宅配：zipCode + 地址

切到「黑貓宅配」：
- [ ] 顯示 zipCode / city / district / address 4 個欄位
- [ ] zipCode 留白送出 → 顯示錯誤 `郵遞區號為必填` 或類似
- [ ] zipCode 輸入 `12`（2 碼）→ 顯示格式錯誤
- [ ] zipCode 輸入 `710` 或 `71001` → 通過
- [ ] address 留白送出 → 顯示 `地址為必填`

### 2.4 中華郵政
- [ ] 同 2.3 行為（黑貓 + 郵政共用 zipCode 邏輯）

### 2.5 自取
- [ ] 顯示 pickupLocation 下拉 + pickupTime 欄位
- [ ] 兩個都填才能送出
- [ ] 運費 = 0

### 2.6 isValid 防呆
- [ ] 缺 customer.name / phone / email → 「下一步」按鈕 disabled
- [ ] 超商選了但 cvsStoreId 空 → disabled
- [ ] 黑貓但 zipCode/address 缺 → disabled

---

## 3. 端到端三種物流（每組 45 分鐘）

> 每組都要走完：下單 → 付款 → 自動建單 → 客戶看到 timeline → admin 看到欄位 → 列印 → 強制刷新

### 3.1 【必測】C2C 7-11 賣貨便（UNIMARTC2C）

**A. 下單**
1. `/store/products` 加 1 個商品（建議單價 < 2000）
2. `/store/cart` 填 customer 資料 → 選「超商店到店」+ 7-11 → 選店
3. 選 LINE Pay → 完成測試付款

**驗證 DB：**
```sql
SELECT order_id, status, payment_method, payment_status,
       logistics_sub_type, cvs_store_brand, cvs_store_id, cvs_store_name,
       logistics_id, shipment_no, payment_no, logistics_status, logistics_message
FROM orders ORDER BY created_at DESC LIMIT 1;
```

- [ ] `payment_status = 'paid'`
- [ ] `logistics_sub_type = 'UNIMARTC2C'`
- [ ] `cvs_store_brand = 'UNIMARTC2C'`
- [ ] `cvs_store_id` 有值
- [ ] `logistics_id` 有值（LINE Pay confirm 自動建單）
- [ ] `shipment_no` 有值
- [ ] `payment_no` 有值（C2C 才有，繳款代碼）

**驗證客戶體驗：**
- [ ] LINE Pay 完成後跳到 `/store/payment/confirm`，看到付款成功 + 物流追蹤區塊
- [ ] 物流追蹤顯示：7-11 賣貨便 / 託運編號 / 繳款代碼 / 取件門市
- [ ] Timeline 4 步驟（訂單建立 / 已寄件 / 已到取件門市 / 已取貨），目前在「訂單建立」
- [ ] 看得到「前往 7-11 賣貨便 官方查詢」連結

**驗證 admin：**
- [ ] `/admin/orders` 列表看到該訂單
- [ ] 「訂單編號」欄位下方有紫色「7-11 賣貨便」標籤 + 託運單號
- [ ] 點「詳情」→ 「綠界物流」區塊全部欄位正確
- [ ] 「下一步」狀態 = `paid`

**驗證 email：**
- [ ] 收到「LINE Pay 付款完成」信件
- [ ] 信中有「📦 查看物流追蹤」按鈕
- [ ] 按鈕連到 `https://bcs.tw/store/track?orderId=...`，顯示 timeline

**驗證 admin LINE：**
- [ ] LINE 收到 PAYMENT CONFIRMED Flex 訊息

### 3.2 【必測】黑貓宅配（TCAT）

新訂單，運送方式選「黑貓宅配」+ zipCode `710` + 地址。

**驗證 DB：**
- [ ] `logistics_sub_type = 'TCAT'`
- [ ] `cvs_store_id` 為空
- [ ] `logistics_id` 有值
- [ ] `shipment_no` 有值
- [ ] `payment_no` 為空（黑貓不需繳款代碼）

**驗證客戶體驗：**
- [ ] payment-confirm 看到「黑貓宅急便」timeline（4 步：訂單建立 / 已取件 / 配送中 / 已送達）
- [ ] 有「前往 黑貓宅急便 官方查詢」連結

### 3.3 【必測】中華郵政（POST）

新訂單，運送方式選「中華郵政」+ zipCode + 地址。

- [ ] `logistics_sub_type = 'POST'`
- [ ] `logistics_id` + `shipment_no` 有值
- [ ] timeline 顯示「訂單建立 / 已交寄 / 投遞中 / 已投遞」

### 3.4 【必測】自取（pickup）

新訂單，運送方式選「自取」+ 取貨地點 + 時段。

**驗證：**
- [ ] DB 中 `logistics_sub_type` 為空（自取**不該**建物流單）
- [ ] DB 中 `logistics_id` 為空
- [ ] payment-confirm 頁顯示「此訂單無需綠界物流追蹤（自取或其他配送方式）」
- [ ] 不會有「物流單尚未建立」的紅色警告（因 hasOrder=false 路徑走另一分支）

### 3.5 【建議測】銀行轉帳分支

新訂單，先**不**選 LINE Pay，改選銀行轉帳：
- [ ] 訂單建立後 `payment_status = 'pending'`，`logistics_id` 為空
- [ ] 客戶收到「訂單確認」email（非「付款完成」），含「📦 查看物流追蹤」按鈕
- [ ] 客戶點 tracking 連結 → 看到「物流單尚未建立——完成付款後將自動建立綠界託運單」

到 admin 把該訂單狀態改成 `paid`：
- [ ] 觸發 `/api/logistics/create-order`，瀏覽器 alert 不會跳錯誤
- [ ] DB 中 `logistics_id` 有值（admin 觸發成功建單）

### 3.6 【可省略】其他 C2C 品牌

只在「7-11 跑通」後想再保險：
- [ ] FAMIC2C（全家）
- [ ] HILIFEC2C（萊爾富）
- [ ] OKMARTC2C（OK）

---

## 4. 後台功能測試（20 分鐘）

進 `/admin/orders`，挑一筆有 logistics_id 的訂單。

### 4.1 列印託運單（C2C）

1. 點「詳情」→ 看到「綠界物流」區塊
2. 點「列印託運單」紫色按鈕

**預期：**
- [ ] 開啟新視窗（瀏覽器需允許 popup）
- [ ] 新視窗自動 POST 到綠界 `PrintUniMartC2COrderInfo`（C2C 7-11 用此 endpoint）
- [ ] 看到綠界產生的託運單 PDF / HTML 預覽

**失敗時：**
- 瀏覽器擋彈窗 → 提示用戶允許 popup
- 看到 409「C2C 賣貨便缺少 CVSPaymentNo」→ 該訂單建單時沒回傳 paymentNo，回去檢查 create-order 回應

### 4.2 列印託運單（HOME — TCAT/POST）

挑 TCAT 訂單，點「列印託運單」：
- [ ] 開新視窗自動 POST 到 `/helper/printTradeDocument`
- [ ] 看到綠界產生的託運單

### 4.3 強制刷新狀態

點「強制刷新」按鈕：
- [ ] Spinner 顯示中
- [ ] 完成後 `logistics_status / logistics_status_at / logistics_message` 更新（即使狀態未變，updated_at 會更新）
- [ ] 不重整頁面就看到最新狀態

### 4.4 下拉狀態變更觸發建單

挑一筆**未建物流**的訂單（status=pending、logistics_id 為空、logistics_sub_type 有值）：
1. 把列表中的狀態下拉改成「已付款」
- [ ] 顯示確認 dialog → 確認
- [ ] 後續自動觸發建單，alert 不出現錯誤
- [ ] DB 中 `logistics_id` 有值

挑**自取**訂單，下拉改成「已付款」：
- [ ] 不會嘗試建單（subType 為空）
- [ ] 沒有任何 alert

---

## 5. 狀態變更通知測試（30 分鐘）

> ⚠️ 這部分需要綠界 sandbox 後台或測試工具觸發狀態變更。如果綠界 sandbox 沒有便利的觸發機制，可改用 6.x 章節的 manual webhook 模擬。

### 5.1 真實綠界 sandbox 後台觸發（首選）

登入綠界 sandbox 廠商後台 → 物流訂單 → 找到剛建立的物流單：
1. 模擬狀態：「已寄件」（C2C 走 311；TCAT 走 901）

**驗證 webhook 收到：**
```sql
SELECT logistics_status, logistics_message, logistics_status_at
FROM orders WHERE logistics_id = '...' LIMIT 1;
```
- [ ] `logistics_status` 變成新狀態碼
- [ ] `logistics_status_at` 是剛剛時間
- [ ] `logistics_message` 有對應文字

**驗證 admin LINE：**
- [ ] LINE 收到「LOGISTICS UPDATE」Flex 訊息
- [ ] altText 包含 `📦` + 「已寄件」+ 訂單號
- [ ] Flex 內容有：物流方式 / 狀態 / 託運單 / 取件門市 / 更新時間

**驗證客戶 email（shipped 是 milestone）：**
- [ ] 客戶 email 收到「📦 已寄件」信件
- [ ] 信中有「📦 查看物流追蹤」CTA 按鈕

**驗證客戶 polling：**
- [ ] 不重整 thank-you / payment-confirm / track 頁面，30 秒內 timeline 自動跳到第 2 步
- [ ] LogisticsTracking 元件中「狀態每 30 秒自動更新」字樣存在

繼續觸發：「到店待取」（C2C 才有）→ admin LINE Flex + 客戶 email「🏪 到店待取」+ email 含取件門市卡片
- [ ] 全部通過

繼續觸發：「已取貨」/「已送達」→ admin LINE + 客戶 email「✅ 已取貨/已送達」
- [ ] 全部通過

### 5.2 手動模擬 webhook（次選，綠界後台觸發不便時）

如果綠界 sandbox 後台無法手動 trigger，用 curl 模擬綠界送 webhook：

```bash
# 注意：需要正確的 CheckMacValue，否則會被擋
# 暫時把 status-webhook.js 中的 verifyCheckMacValue 暫時註解掉測試（測完記得還原！）
curl -i -X POST https://<preview-url>/api/logistics/status-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'AllPayLogisticsID=<填真實 logistics_id>&RtnCode=311&RtnMsg=已寄件&MerchantID=...&MerchantTradeNo=...&CheckMacValue=BYPASS'
```

⚠️ **這條路有風險**，因為 verifyCheckMacValue 會被你暫時註解，記得測完還原。
建議：用 5.1 真實後台觸發，避免動 production code。

### 5.3 重送風暴防護

模擬綠界連續 5 次重送相同 webhook：
- [ ] 5 次都回 200 + `1|OK`
- [ ] DB 只更新一次（status 沒變的話 `notifyGASServer` 不重複呼叫，看 admin LINE 有無重複）
- [ ] admin LINE 不會收到 5 則重複 Flex（因為 `if (String(order.logistics_status) !== String(rtnCode))` 防呆）

---

## 6. 錯誤場景測試（20 分鐘）

### 6.1 收件人手機格式錯誤

故意填一個錯的手機（例如 `0912`、`12345678901`）下單：
- [ ] 前端 isValid 擋下，無法送出
- [ ] 若直接 patch DB 改成錯的手機再呼叫 create-order，後端會回 `收件人手機需為 09 開頭 10 碼`

### 6.2 zipCode 缺失

黑貓訂單但 zipCode 空：
- [ ] 前端 isValid 擋下
- [ ] 後端會回 `宅配訂單缺少收件人郵遞區號`

### 6.3 重複建單（idempotency）

對已有 logistics_id 的訂單，再次呼叫 `/api/logistics/create-order`：
- [ ] 回 200 + `{alreadyCreated: true}`
- [ ] DB 中 logistics_id 不變
- [ ] 不會建立第二筆綠界託運單

### 6.4 訂單不存在

```bash
curl -i "https://<preview-url>/api/logistics/query-status?orderId=NOT_EXIST"
```
- [ ] 回 404 + `{error: "訂單不存在"}`

### 6.5 印單但訂單未建立物流

對沒有 logistics_id 的訂單點「列印託運單」：
- [ ] alert：「此訂單尚未建立綠界物流單，無法列印託運單。」

### 6.6 自動建單失敗 → notification_failures

故意讓 sandbox 環境某筆建單失敗（例如：填一個錯的 zipCode 跳過前端 → 直接 patch DB → 觸發 admin 建單按鈕）：
```sql
SELECT * FROM notification_failures
WHERE notification_type = 'logistics_create'
ORDER BY created_at DESC LIMIT 5;
```
- [ ] 看到一筆失敗紀錄
- [ ] payload 中含 orderId、error 訊息

### 6.7 GAS V6 兼容舊 V5 訊息

把 GAS 版本暫時切回 V5（`logistics_status` case 不存在），觸發狀態變更：
- [ ] V5 fallback 走 CASE 6（NEW ORDER），由於 payload type='logistics_status' 不是 type='custom_quote' 等任何已知 case，**會掉到 fallback CASE 6**，可能會送出格式錯誤的訂單通知
- [ ] **驗證後切回 V6**

⚠️ 這個測試可選，主要在 push 之前確認新舊 GAS 切換不爆炸。

---

## 7. 切正式環境步驟（10 分鐘 + 等待時間）

> ⚠️ **執行前**：上面 1–6 全部通過

### 7.1 確認綠界 MerchantID 同時支援 C2C + B2C

打電話 / 發 email 問綠界業務：
- [ ] 比創空間正式 MerchantID 是否同時掛了 C2C 賣貨便（UNIMARTC2C/FAMIC2C/HILIFEC2C/OKMARTC2C）+ B2C 黑貓 + B2C 中華郵政？

**回應 A：是，單一 MerchantID 全包**
→ 直接執行 7.2

**回應 B：不行，C2C 和 B2C 物流要分開申請**
→ 暫停切正式，需先做 Phase 6.8（拆分 env vars）：
- 新增 `ECPAY_LOGISTICS_C2C_MERCHANT_ID` / `_HASH_KEY` / `_HASH_IV`
- 新增 `ECPAY_LOGISTICS_HOME_MERCHANT_ID` / `_HASH_KEY` / `_HASH_IV`
- 改 `_lib/check-mac.js getLogisticsEnv` 接受 subType 參數動態選擇
- 改所有呼叫點傳入 subType

### 7.2 切正式 env

到 Vercel：
- [ ] `ECPAY_LOGISTICS_BASE_URL` 從 `logistics-stage.ecpay.com.tw` 改成 `logistics.ecpay.com.tw`
- [ ] `ECPAY_LOGISTICS_MERCHANT_ID` / `HASH_KEY` / `HASH_IV` 切成正式組
- [ ] LINE Pay 也記得切正式（如果還沒）
- [ ] 觸發 redeploy

### 7.3 小量正式單實測

- [ ] 自己用真實信用卡下一筆小額測試訂單（< 100 元，可後續退款）
- [ ] 確認自動建單 OK
- [ ] 確認綠界廠商後台看到正式託運單
- [ ] 不要打印（避免實體出貨流程）

### 7.4 監控

接下來 24 小時觀察：
- [ ] Vercel logs：搜尋 `[logistics/`，看有無未捕捉錯誤
- [ ] `notification_failures` 表：每天看一次，有失敗主動處理
- [ ] admin LINE：是否有不預期的訊息

---

## 8. 完成判定

全部通過後：
1. [ ] 把 `phase6_test_plan.md` 中所有 checkbox 截圖留底（or commit 到 repo）
2. [ ] git push
3. [ ] 在 memory 中更新 `project_ecpay_logistics_plan.md` 標記 Phase 6.7 完成
4. [ ] 把 `phase6_test_plan.md` 從 repo 移出（或保留作為日後 regression test 範本）

---

## 附錄 A：綠界狀態碼對照（webhook RtnCode）

| 物流類型 | RtnCode | 含義 | milestone |
|---------|---------|------|-----------|
| **C2C 共用** | 300, 2030 | 訂單建立 | created |
| C2C | 310, 311 | 已寄件 | shipped |
| C2C | 2063, 325, 2067 | 到店待取 | arrived |
| C2C | 320, 322 | 已取貨 | delivered |
| **TCAT** | 300 | 訂單建立 | created |
| TCAT | 901, 902 | 已取件 | shipped |
| TCAT | 906, 907 | 配送中 | inTransit |
| TCAT | 908, 5008 | 已送達 | delivered |
| **POST** | 300 | 訂單建立 | created |
| POST | 30001 | 已交寄 | shipped |
| POST | 30002 | 投遞中 | inTransit |
| POST | 30003 | 已投遞 | delivered |

`milestone` shipped/arrived/delivered 會觸發客戶 email；created/inTransit/unknown 不會。
admin LINE Flex 不論 milestone 都會推。

---

## 附錄 B：常用排查 SQL

```sql
-- 看最近 10 筆訂單的物流狀態
SELECT order_id, status, payment_status,
       logistics_sub_type, logistics_id, shipment_no, payment_no,
       logistics_status, logistics_message, logistics_status_at
FROM orders ORDER BY created_at DESC LIMIT 10;

-- 看物流通知失敗
SELECT * FROM notification_failures
WHERE notification_type LIKE '%logistics%'
ORDER BY created_at DESC LIMIT 20;

-- 找應該建單但沒建的訂單
SELECT order_id, status, payment_status, logistics_sub_type, logistics_id
FROM orders
WHERE payment_status = 'paid'
  AND logistics_sub_type IS NOT NULL
  AND logistics_id IS NULL
ORDER BY created_at DESC;
```

---

## 附錄 C：Vercel logs 查看方式

```bash
# CLI（需 vercel login）
vercel logs <deployment-url> --follow
vercel logs <deployment-url> --since=1h | grep "\[logistics/"
```

或到 Vercel Dashboard → 該 project → Deployments → 點某個 deployment → Functions → 篩選 path 為 `api/logistics/*`。

---

## 附錄 D：可能踩到的雷

| 症狀 | 可能原因 | 排查 |
|------|---------|------|
| 選店 callback 後門市資訊沒帶回 | `VITE_LOGISTICS_REPLY_URL` 設錯 | 檢查 Vercel env，必須是 callback endpoint |
| webhook 收到但 DB 沒更新 | CheckMacValue 驗證失敗 | Vercel logs 找 `CheckMacValue 驗證失敗`，比對 HashKey/IV |
| 自動建單收到 422 | 收件人手機格式 / zipCode 缺漏 | 看 logs error message + DB user_info |
| LINE 沒收到通知 | GAS 部屬 URL 變了 / Token 過期 | GAS 執行 `testLine()` 驗證 |
| Email CTA 連到 `localhost` | GAS Property `BCS_BASE_URL` 沒設 | 設成 `https://bcs.tw` |
| 列印按鈕無反應 | 瀏覽器擋 popup | 允許 bcs.tw popup |
| Sandbox payment_no 為空 | 該 C2C 品牌 sandbox 不回 PaymentNo | 換正式環境試 / 改用 TCAT 路徑 |

---

**測試計畫結束。執行時逐 section 完成，遇到 ❌ 立刻停下偵錯，不跳關。**
