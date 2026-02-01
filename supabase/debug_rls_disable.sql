-- EMERGENCY DEBUG: DISABLE RLS
-- This is to verify if permissions are the cause of "0 items".
-- WARNING: This makes the table public. We will re-enable it later.

-- 1. Disable RLS (No policies checked, pure open access)
alter table products disable row level security;

-- 2. Force Active (Again, just in case)
update products set is_active = true;

-- 3. Check what we have
select id, name, is_active from products;
