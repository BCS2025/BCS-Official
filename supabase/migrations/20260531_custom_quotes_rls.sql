-- =============================================================================
-- 修正鍛造工坊報價送出失敗（custom_quotes RLS）
-- 日期：2026-05-31
-- 問題：
--   訪客(anon)送出報價需 INSERT custom_quotes，但該表 RLS 沒有放行 anon 的 INSERT policy，
--   出現「new row violates row-level security policy for table custom_quotes」。
-- 解法：
--   新增「僅允許新增、不允許讀取」的 anon INSERT policy（與 orders 一致）。
--   anon 仍無法讀取 custom_quotes（不另加 select policy），個資保持不外洩。
--
-- 執行方式：貼到 Supabase → SQL Editor → Run。
-- =============================================================================

alter table custom_quotes enable row level security;

drop policy if exists "Public Insert Quotes" on custom_quotes;
create policy "Public Insert Quotes" on custom_quotes
  for insert to anon, authenticated
  with check (true);

-- 驗證（可單獨跑）：應看到 Public Insert Quotes(INSERT)
-- select policyname, cmd, roles from pg_policies
--   where tablename = 'custom_quotes' order by policyname;
