-- Inventory System Implementation (Readable Names Version)

-- 1. Create Materials Table
drop table if exists product_recipes cascade;
drop table if exists materials cascade;

create table materials (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  current_stock int not null default 0,
  safety_stock int not null default 10,
  unit text default 'pcs',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Product Recipes Table (BOM)
-- Added 'product_name' and 'material_name' for readability
create table product_recipes (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  material_id uuid not null references materials(id) on delete cascade,
  product_name text, -- Readable Product Name
  material_name text, -- Readable Material Name
  quantity_required int not null default 1,
  match_condition jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Auto-Deduction Trigger Function
create or replace function auto_deduct_inventory()
returns trigger
language plpgsql
security definer
as $$
declare
  item jsonb;
  recipe record;
  deduct_qty int;
begin
  for item in select * from jsonb_array_elements(NEW.items)
  loop
    for recipe in
      select * from product_recipes
      where product_id = (item->>'productId')::uuid
      and (match_condition is null or item @> match_condition)
    loop
       deduct_qty := (item->>'quantity')::int * recipe.quantity_required;
       update materials
       set current_stock = current_stock - deduct_qty
       where id = recipe.material_id;
    end loop;
  end loop;
  return NEW;
end;
$$;

-- 4. Create Trigger
drop trigger if exists trigger_deduct_inventory on orders;
create trigger trigger_deduct_inventory
  after insert on orders
  for each row
  execute function auto_deduct_inventory();

-- 5. User-Provided Seed Data
do $$
declare
  -- Material IDs
  m_kc_round uuid;
  m_kc_heart uuid;
  m_kc_rect uuid;
  m_kc_shield uuid;
  m_kc_square uuid;
  
  m_coaster_beech uuid;
  m_coaster_walnut uuid;
  
  m_base_white uuid;
  m_base_warm uuid;

  -- Product IDs
  p_keychain uuid;
  p_coaster uuid;
  p_night_light uuid;
  p_tile_light uuid;
  
begin
  -- A. Insert Materials & Stock
  insert into materials (name, current_stock, safety_stock) values 
    ('圓形櫸木鑰匙圈原料', 25, 5) returning id into m_kc_round;
    
  insert into materials (name, current_stock, safety_stock) values 
    ('心形櫸木鑰匙圈原料', 5, 2) returning id into m_kc_heart;
    
  insert into materials (name, current_stock, safety_stock) values 
    ('矩形櫸木鑰匙圈原料', 95, 10) returning id into m_kc_rect;
    
  insert into materials (name, current_stock, safety_stock) values 
    ('盾牌櫸木鑰匙圈原料', 45, 5) returning id into m_kc_shield;
    
  insert into materials (name, current_stock, safety_stock) values 
    ('正方形櫸木鑰匙圈原料', 15, 3) returning id into m_kc_square;

  insert into materials (name, current_stock, safety_stock) values 
    ('櫸木圓形凹槽款杯墊', 10, 2) returning id into m_coaster_beech;
    
  insert into materials (name, current_stock, safety_stock) values 
    ('胡桃木圓形凹槽款杯墊', 10, 2) returning id into m_coaster_walnut;
    
  insert into materials (name, current_stock, safety_stock) values 
    ('15cm通槽電池盒款白光底座', 10, 2) returning id into m_base_white;
    
  insert into materials (name, current_stock, safety_stock) values 
    ('15cm通槽電池盒款暖光底座', 10, 2) returning id into m_base_warm;


  -- B. Lookup Products
  select id into p_keychain from products where slug = 'wooden-keychain';
  select id into p_coaster from products where slug = 'wooden-coaster';
  select id into p_night_light from products where slug = 'night-light';
  select id into p_tile_light from products where slug = 'tile-night-light';


  -- C. Create Recipes with NAMES
  -- Now inserting product_name and material_name for readability

  -- 1. Keychain Recipes
  if p_keychain is not null then
    insert into product_recipes (product_id, product_name, material_id, material_name, match_condition) values
    (p_keychain, '客製化木質鑰匙圈', m_kc_round, '圓形櫸木鑰匙圈原料', '{"shape": "keychain_round"}'),
    (p_keychain, '客製化木質鑰匙圈', m_kc_heart, '心形櫸木鑰匙圈原料', '{"shape": "keychain_heart"}'),
    (p_keychain, '客製化木質鑰匙圈', m_kc_rect, '矩形櫸木鑰匙圈原料', '{"shape": "keychain_rect"}'),
    (p_keychain, '客製化木質鑰匙圈', m_kc_shield, '盾牌櫸木鑰匙圈原料', '{"shape": "keychain_shield"}'),
    (p_keychain, '客製化木質鑰匙圈', m_kc_square, '正方形櫸木鑰匙圈原料', '{"shape": "keychain_square"}');
  end if;

  -- 2. Coaster Recipes
  if p_coaster is not null then
    insert into product_recipes (product_id, product_name, material_id, material_name, match_condition) values
    (p_coaster, '客製化原木杯墊', m_coaster_beech, '櫸木圓形凹槽款杯墊', '{"material": "coaster_beech"}'),
    (p_coaster, '客製化原木杯墊', m_coaster_walnut, '胡桃木圓形凹槽款杯墊', '{"material": "coaster_walnut"}');
  end if;

  -- 3. Night Light & Tile Light Recipes
  if p_night_light is not null then
    insert into product_recipes (product_id, product_name, material_id, material_name, match_condition) values
    (p_night_light, '客製化小夜燈', m_base_warm, '15cm通槽電池盒款暖光底座', '{"lightBase": "light_base_warm"}'),
    (p_night_light, '客製化小夜燈', m_base_white, '15cm通槽電池盒款白光底座', '{"lightBase": "light_base_white"}');
  end if;

  if p_tile_light is not null then
    insert into product_recipes (product_id, product_name, material_id, material_name, match_condition) values
    (p_tile_light, '花磚小夜燈', m_base_warm, '15cm通槽電池盒款暖光底座', '{"lightBase": "light_base_warm"}'),
    (p_tile_light, '花磚小夜燈', m_base_white, '15cm通槽電池盒款白光底座', '{"lightBase": "light_base_white"}');
  end if;
  
end $$;
