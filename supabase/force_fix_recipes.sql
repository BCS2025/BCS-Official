-- FORCE FIX RECIPES (Execute in Supabase SQL Editor)
-- This script repairs the missing link between "Product" and "Material"

do $$
declare
  p_id uuid;
  m_round uuid;
  m_heart uuid;
  m_rect uuid;
  m_shield uuid;
  m_square uuid;
begin
  -- 1. Find Product by Chinese Name (Most reliable reference)
  select id into p_id from products where name = '客製化木質鑰匙圈';
  
  if p_id is null then
    raise exception 'Product 找不到! 請確認商品名稱是否為: 客製化木質鑰匙圈';
  end if;

  -- 2. Ensure Slug is set (just in case)
  update products set slug = 'wooden-keychain' where id = p_id;

  -- 3. Find Materials
  select id into m_round from materials where name = '圓形櫸木鑰匙圈原料';
  select id into m_heart from materials where name = '心形櫸木鑰匙圈原料';
  select id into m_rect from materials where name = '矩形櫸木鑰匙圈原料';
  select id into m_shield from materials where name = '盾牌櫸木鑰匙圈原料';
  select id into m_square from materials where name = '正方形櫸木鑰匙圈原料';

  if m_round is null then raise warning 'Material 圓形原料 找不到!'; end if;

  -- 4. DELETE OLD RECIPES (Clean Slate)
  delete from product_recipes where product_id = p_id;

  -- 5. INSERT RECIPES (The Linkage)
  -- Round
  if m_round is not null then
    insert into product_recipes (product_id, material_id, quantity_required, match_condition)
    values (p_id, m_round, 1, '{"shape": "keychain_round"}');
  end if;

  -- Heart
  if m_heart is not null then
    insert into product_recipes (product_id, material_id, quantity_required, match_condition)
    values (p_id, m_heart, 1, '{"shape": "keychain_heart"}');
  end if;

  -- Rect
  if m_rect is not null then
    insert into product_recipes (product_id, material_id, quantity_required, match_condition)
    values (p_id, m_rect, 1, '{"shape": "keychain_rect"}');
  end if;

  -- Shield
  if m_shield is not null then
    insert into product_recipes (product_id, material_id, quantity_required, match_condition)
    values (p_id, m_shield, 1, '{"shape": "keychain_shield"}');
  end if;

  -- Square
  if m_square is not null then
    insert into product_recipes (product_id, material_id, quantity_required, match_condition)
    values (p_id, m_square, 1, '{"shape": "keychain_square"}');
  end if;

end $$;

-- 6. VERIFICATION (Check if it works)
-- This will output the calculated stock for Round Keychain directly.
-- If this returns 9999, something is definitely wrong.
-- If it returns 25 (or current stock), it worked.

select 
  p.name as product_name, 
  calculate_max_stock(p.slug, '{"shape": "keychain_round"}') as calculated_stock_json
from products p
where p.name = '客製化木質鑰匙圈';
