# 比創空間官網 — Claude 專案說明

## 專案現況
此專案正在進行**全面重構**，從販創所購物網站升級為比創空間三品牌官方網站。

**完整規劃文件：** `implementation_plan.md`（專案根目錄）
**架構決策與進度：** Claude memory `project_rewrite_plan.md`

## 每個 session 開始前必做
1. 讀取 `implementation_plan.md` 確認當前 Phase 與 checkbox 狀態
2. 確認當前 Phase（Phase 0 → 1 → 2 → 3 → 4 → 5）
3. 從上次完成的最後一個 checkbox 繼續

## 關鍵架構決策（勿違反）
- 電商路由全部在 `/store/*` 前綴下
- 購物車 state 只屬於販創所，不跨品牌共用
- `paymentService.js` 是金流唯一入口，禁止在其他地方直接寫付款邏輯
- 設計系統：移除所有 `wood-*`、`muji-*`、`amber-*` class，使用三品牌色系

## 三品牌色系
- 販創所：`#EA580C`（橘）
- 鍛造工坊：`#1D4ED8`（藍）
- 創客世界：`#16A34A`（綠）

## 技術棧
React + Vite + TailwindCSS + Supabase + Vercel

## 通知機制
GAS Webhook（`VITE_GAS_WEBHOOK_URL`），通知 Email + Line Messaging API
