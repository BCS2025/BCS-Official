-- 1. Re-enable Security (This removes the "Unrestricted" warning)
alter table orders enable row level security;

-- 2. clean slate: drop policies (ignore errors if they don't exist)
drop policy if exists "Public Create Order" on orders;
drop policy if exists "Enable insert for anon (public) users" on orders;
drop policy if exists "Allow Public Insert" on orders;
drop policy if exists "Allow Service Role Select" on orders;

-- 3. Policy: Allow Public (Anon) to INSERT only
-- "with check (true)" means they can insert any row
create policy "Public Insert Only"
on orders for insert
to anon, authenticated
with check (true);

-- 4. Policy: Allow Admin (Service Role) to DO EVERYTHING
-- Service role always bypasses RLS by default in many contexts, but explicit is better for "select" via client
create policy "Admin Full Access"
on orders for all
to service_role
using (true)
with check (true);

-- 5. IMPORTANT: Ensure NO policy exists for "Select" for "Anon".
-- This ensures the public cannot read the table.
