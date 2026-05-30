# ⚠️ 已封存的危險 / 過時 SQL

這個資料夾收錄**早期除錯與一次性 hack 用的 SQL**，它們已被正式 migration 取代。

## 🚫 請勿直接執行這裡的任何檔案

其中數個會「關閉 Row Level Security」，若誤套到正式資料庫，會造成**訂單個資對外公開**等嚴重後果（2026-05 的 `orders` 資料外洩事件即源於 `disable_rls_orders.sql`）。

## 正確做法

`orders` 與相關表的 RLS 政策，一律以 `supabase/migrations/` 內的正式 migration 為準：

- `migrations/20260531_orders_rls.sql` — orders 表 RLS 的權威版本（anon 僅可新增、authenticated 後台可讀改刪）

## 封存清單與原因

| 檔案 | 原因 |
|------|------|
| `disable_rls_orders.sql` | **危險**：直接關閉 orders 的 RLS（資料外洩事件根因） |
| `debug_rls_disable.sql` | **危險**：關閉 products 的 RLS + 強制全部 is_active |
| `fix_rls.sql` | 過時：早期 orders policy 嘗試，已被 20260531 取代 |
| `force_fix_rls.sql` | 過時：service_role-only select 設計，後台（authenticated）會讀不到 |
| `secure_orders.sql` | 過時：同上，service_role-only select 設計 |
| `restore_rls_safety.sql` | 過時：僅處理 products，部分內容已併入正式流程 |
