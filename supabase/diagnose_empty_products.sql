-- DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to see what's wrong.

-- 1. Check Row Counts
select 'Total Rows' as check_name, count(*) as count from products
union all
select 'Active Rows', count(*) from products where is_active = true;

-- 2. Preview Data (Top 5)
select id, name, is_active, price from products limit 5;

-- 3. FORCE FIX RLS (If query is blocked)
-- Ensure Public can read EVERYTHING
drop policy if exists "Public Read Products" on products;
create policy "Public Read Products" on products for select using (true);
alter table products enable row level security;

-- 4. FORCE FIX is_active (Again)
update products set is_active = true;

-- 5. Verify ID Format (Should be 'prod_...')
select id from products where id not like 'prod_%';
