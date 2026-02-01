-- REPAIR PRODUCT SCHEMA
-- Ensures all columns required by the Frontend exist.
-- Fixes "0 items" caused by missing 'is_active' or 'sort_order'.

-- 1. Ensure 'is_active' exists (Critical for filtering)
alter table products add column if not exists is_active boolean default true;
update products set is_active = true where is_active is null;

-- 2. Ensure 'sort_order' exists (Critical for sorting)
alter table products add column if not exists sort_order int default 10;

-- 3. Ensure 'config_schema' exists (Critical for Dynamic UI)
alter table products add column if not exists config_schema jsonb default '[]'::jsonb;

-- 4. Ensure 'is_on_sale' exists (Critical for Phase 2)
alter table products add column if not exists is_on_sale boolean default false;
alter table products add column if not exists sale_price int;

-- 5. Force Refresh Cache (Supabase sometimes caches schema definitions)
notify pgrst, 'reload config';
