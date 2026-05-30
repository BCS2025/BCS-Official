-- FORCE FIX: Drop ALL existing and potential policies to ensure a clean slate
drop policy if exists "Public Create Order" on orders;
drop policy if exists "Enable insert for anon (public) users" on orders;
drop policy if exists "Enable all access for service_role" on orders;
drop policy if exists "Allow Public Insert" on orders; -- This is the one causing the error
drop policy if exists "Allow Service Role Select" on orders;

-- 1. Enable RLS
alter table orders enable row level security;

-- 2. Create the Public Insert Policy
create policy "Allow Public Insert"
on orders for insert
with check (true);

-- 3. Create the Service Role Select Policy (Admin only)
create policy "Allow Service Role Select"
on orders for select
using (auth.role() = 'service_role');

-- 4. Grant explicit permissions
grant insert on table orders to anon;
grant insert on table orders to authenticated;
grant select on table orders to service_role;
