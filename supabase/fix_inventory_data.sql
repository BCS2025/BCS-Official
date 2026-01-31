-- FIX DATA INTEGRITY
-- This script ensures products have correct slugs and recipes are linked to them.

-- 1. Ensure slug column exists and is unique
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'slug') then
        alter table products add column slug text unique;
    end if;
end $$;

-- 2. Update/Insert Products to match Frontend IDs
-- We map the specific known IDs from products.js to the DB rows
-- Note: We rely on 'name' to find existing rows if slug is missing.

update products set slug = 'wooden-keychain' where name = '客製化木質鑰匙圈';
update products set slug = 'tile-night-light' where name = '花磚小夜燈';
update products set slug = 'spring-couplets' where name = '立體春聯';
update products set slug = 'wooden-coaster' where name = '客製化原木杯墊';
update products set slug = 'tile-calendar' where name = '花磚月曆';
update products set slug = 'night-light' where name = '客製化小夜燈';

-- 3. Verify IDs needed for Recipes
do $$
declare
  p_keychain uuid;
  m_kc_round uuid;
  m_kc_heart uuid;
  m_kc_rect uuid;
  m_kc_shield uuid;
  m_kc_square uuid;
begin
  -- Get Product UUID
  select id into p_keychain from products where slug = 'wooden-keychain';
  
  if p_keychain is null then
     raise notice 'Product wooden-keychain not found! Please check product names.';
     return;
  end if;

  -- Get Material UUIDs (Assuming materials exist from previous seed)
  select id into m_kc_round from materials where name = '圓形櫸木鑰匙圈原料';
  select id into m_kc_heart from materials where name = '心形櫸木鑰匙圈原料';
  select id into m_kc_rect from materials where name = '矩形櫸木鑰匙圈原料';
  select id into m_kc_square from materials where name = '正方形櫸木鑰匙圈原料';
  select id into m_kc_shield from materials where name = '盾牌櫸木鑰匙圈原料';

  -- 4. Re-Insert Recipes to guarantee linkage
  -- We delete existing recipes for this product to avoid duplicates/stale links
  delete from product_recipes where product_id = p_keychain;

  -- Insert (using the found UUIDs)
  if m_kc_round is not null then
      insert into product_recipes (product_id, material_id, quantity_required, match_condition) values
      (p_keychain, m_kc_round, 1, '{"shape": "keychain_round"}');
  end if;
  
  if m_kc_heart is not null then
      insert into product_recipes (product_id, material_id, quantity_required, match_condition) values
      (p_keychain, m_kc_heart, 1, '{"shape": "keychain_heart"}');
  end if;

  if m_kc_rect is not null then
      insert into product_recipes (product_id, material_id, quantity_required, match_condition) values
      (p_keychain, m_kc_rect, 1, '{"shape": "keychain_rect"}');
  end if;

  if m_kc_shield is not null then
      insert into product_recipes (product_id, material_id, quantity_required, match_condition) values
      (p_keychain, m_kc_shield, 1, '{"shape": "keychain_shield"}');
  end if;

  if m_kc_square is not null then
      insert into product_recipes (product_id, material_id, quantity_required, match_condition) values
      (p_keychain, m_kc_square, 1, '{"shape": "keychain_square"}');
  end if;
  
end $$;
