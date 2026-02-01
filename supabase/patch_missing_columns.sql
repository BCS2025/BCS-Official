-- PATCH: Add missing control columns
-- Fixes "0 Items" issue where frontend filters on is_active

alter table products 
add column if not exists is_active boolean default true;

alter table products 
add column if not exists sort_order int default 0;

-- Optional: Update sort order for specific items if needed
update products set sort_order = 10 where id = 'prod_keychain_custom';
update products set sort_order = 9 where id = 'prod_nightlight_tile';
