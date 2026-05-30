-- =============================================================================
-- 修復：重新開啟 orders 表的 Row Level Security（RLS）
-- 日期：2026-05-31
-- 背景：
--   先前 supabase/disable_rls_orders.sql 用「核彈級」做法關閉了 orders 的 RLS，
--   並 grant select 給 anon，導致任何人拿到前端 anon key 即可讀走全部訂單個資
--   （客戶姓名 / 電話 / 地址 / Email / 購買內容）。Supabase advisor 因此跳出
--   CRITICAL：「Policy Exists RLS Disabled」+「RLS Disabled in Public」。
--
-- 本檔修復目標（依本專案實際架構）：
--   - 客戶（anon）             → 只能「新增訂單」，不能讀
--   - 後台管理員（authenticated）→ 可讀 / 改 / 刪（後台用 Supabase Auth 登入）
--   - 後端 API（service_role）  → 一律 bypass RLS（金流 / 物流用）
--
-- 前置條件（已確認）：
--   Vercel 已設定 SUPABASE_SERVICE_ROLE_KEY，後端 API 才能正常讀寫 orders。
--   若未設定，confirm / query-status / create-order / status-webhook 會壞掉。
--
-- 執行方式：貼到 Supabase → SQL Editor → Run。
-- =============================================================================

-- 1. 重新開啟 RLS（移除 advisor 的 CRITICAL 警告）
alter table orders enable row level security;

-- 2. 清掉歷史上殘留 / 互相衝突的 policy（不存在則略過）
drop policy if exists "Public Create Order" on orders;
drop policy if exists "Enable insert for anon (public) users" on orders;
drop policy if exists "Allow Public Insert" on orders;
drop policy if exists "Allow Service Role Select" on orders;
drop policy if exists "Public Insert Only" on orders;
drop policy if exists "Admin Full Access" on orders;
drop policy if exists "Admin Read" on orders;
drop policy if exists "Admin Update" on orders;
drop policy if exists "Admin Delete" on orders;

-- 3. 公開結帳：anon + authenticated 可「新增」訂單，但「不可讀」
--    （orderService.submitOrder 不做 .select()，所以 insert 不需要 RETURNING）
create policy "Public Insert Only" on orders
  for insert to anon, authenticated
  with check (true);

-- 4. 後台（authenticated = 管理員）可讀 / 改 / 刪
--    本站只有管理員會登入（已關閉公開註冊），故 authenticated 等同管理員。
create policy "Admin Read"   on orders for select to authenticated using (true);
create policy "Admin Update" on orders for update to authenticated using (true) with check (true);
create policy "Admin Delete" on orders for delete to authenticated using (true);

-- 5. 防禦縱深：收回 disable_rls_orders.sql 當初多給 anon 的 select 權限。
--    （RLS policy 才是主要控制；這層 grant 再補一刀，雙保險）
revoke select on table orders from anon;

-- =============================================================================
-- 驗證（執行後可單獨跑這幾段確認）
-- =============================================================================

-- (1) 確認 RLS 已開啟：relrowsecurity 應為 true
-- select relname, relrowsecurity from pg_class where relname = 'orders';

-- (2) 列出目前 policy：應看到 Public Insert Only(insert) + Admin Read/Update/Delete
-- select policyname, cmd, roles from pg_policies where tablename = 'orders' order by policyname;

-- (3) 確認 anon 已無 select 權限：下列查詢不應出現 anon + SELECT 的列
-- select grantee, privilege_type from information_schema.role_table_grants
--   where table_name = 'orders' and grantee = 'anon';
