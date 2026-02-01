-- SYSTEM OVERHAUL: RESET & SEED (English Codes Version)
-- WARNING: This will WIPE all inventory and order data.

-- 1. DROP EXISTING SCHEMA
drop trigger if exists trigger_deduct_inventory on orders;
drop function if exists auto_deduct_inventory;
drop function if exists calculate_max_stock;
drop function if exists lookup_product_id;

drop table if exists product_recipes cascade;
drop table if exists materials cascade;
-- We need to drop orders because it references products
drop table if exists orders cascade; 
drop table if exists products cascade;

-- 2. CREATE NEW SCHEMA (Text IDs)

-- Products: ID is the English Code (e.g. 'prod_keychain_custom')
create table products (
  id text primary key, -- English Code
  name text not null,  -- Chinese Display Name (for fallback)
  description text,
  price int not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Materials: ID is the English Code (e.g. 'mat_keychain_round')
create table materials (
  id text primary key, -- English Code
  name text not null,  -- Chinese Display Name
  current_stock int not null default 0,
  safety_stock int not null default 10,
  unit text default 'pcs',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Recipes
create table product_recipes (
  id uuid primary key default uuid_generate_v4(),
  product_id text not null references products(id) on delete cascade,
  material_id text not null references materials(id) on delete cascade,
  quantity_required int not null default 1,
  match_condition jsonb, -- e.g. {"shape": "round"}
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Orders (Simplified re-creation)
create table orders (
  id uuid primary key default uuid_generate_v4(),
  item_name text not null,
  amount int not null,
  status text default 'pending',
  customer_info jsonb,
  items jsonb, -- Stores the cart snapshot
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. SEED DATA (Use Standardized Codes)

-- A. Products
insert into products (id, name, price) values
('prod_keychain_custom', '客製化櫸木鑰匙圈', 99),
('prod_coaster_custom', '客製化原木杯墊', 290),
('prod_nightlight_custom', '客製化小夜燈', 490),
('prod_nightlight_tile', '花磚小夜燈', 590),
('prod_calendar_tile', '花磚月曆', 690),
('prod_couplets_3d', '立體春聯', 399);

-- B. Materials
insert into materials (id, name, current_stock, safety_stock) values
-- Keychain Materials
('mat_keychain_round', '圓形櫸木鑰匙圈原料', 25, 5),
('mat_keychain_heart', '心形櫸木鑰匙圈原料', 5, 2),
('mat_keychain_rect', '矩形櫸木鑰匙圈原料', 95, 10),
('mat_keychain_shield', '盾牌櫸木鑰匙圈原料', 45, 5),
('mat_keychain_square', '正方形櫸木鑰匙圈原料', 15, 3),

-- Coaster Materials
('mat_coaster_beech', '櫸木圓形凹槽款杯墊', 10, 2),
('mat_coaster_walnut', '胡桃木圓形凹槽款杯墊', 10, 2),

-- Light Bases
('mat_base_15cm_bat_white', '15cm通槽電池盒款白光底座', 20, 5), -- Shared by multiple products
('mat_base_15cm_bat_warm', '15cm通槽電池盒款暖光底座', 20, 5);

-- C. Recipes

-- Keychain Recipes
insert into product_recipes (product_id, material_id, match_condition) values
('prod_keychain_custom', 'mat_keychain_round', '{"shape": "round"}'),
('prod_keychain_custom', 'mat_keychain_heart', '{"shape": "heart"}'),
('prod_keychain_custom', 'mat_keychain_rect', '{"shape": "rect"}'),
('prod_keychain_custom', 'mat_keychain_shield', '{"shape": "shield"}'),
('prod_keychain_custom', 'mat_keychain_square', '{"shape": "square"}');

-- Coaster Recipes
insert into product_recipes (product_id, material_id, match_condition) values
('prod_coaster_custom', 'mat_coaster_beech', '{"material": "beech"}'),
('prod_coaster_custom', 'mat_coaster_walnut', '{"material": "walnut"}');

-- Night Light Recipes (Custom & Tile use same bases)
insert into product_recipes (product_id, material_id, match_condition) values
('prod_nightlight_custom', 'mat_base_15cm_bat_white', '{"lightBase": "white"}'),
('prod_nightlight_custom', 'mat_base_15cm_bat_warm', '{"lightBase": "warm"}'),
('prod_nightlight_tile', 'mat_base_15cm_bat_white', '{"lightBase": "white"}'),
('prod_nightlight_tile', 'mat_base_15cm_bat_warm', '{"lightBase": "warm"}');

-- 4. RE-CREATE FUNCTIONS (Updated for Text IDs)

-- Calculate Max Stock (Universal)
create or replace function calculate_max_stock(
  p_product_id text, -- Matches table ID type
  p_variants jsonb,
  p_cart_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_max_quantity int;
  v_is_low_stock boolean;
begin
  -- 1. Calculate Consumption & Effective Stock
  with cart_consumption as (
    select 
      r.material_id,
      sum((cart_item->>'quantity')::int * r.quantity_required) as consumed_qty
    from jsonb_array_elements(p_cart_items) as cart_item
    join product_recipes r on r.product_id = (cart_item->>'productId') -- Direct Text Match
    where (r.match_condition is null or cart_item @> r.match_condition)
    group by r.material_id
  ),
  effective_stock as (
    select
      m.id as material_id,
      m.current_stock - coalesce(cc.consumed_qty, 0) as available_stock,
      m.safety_stock,
      pr.quantity_required
    from materials m
    join product_recipes pr on pr.material_id = m.id
    left join cart_consumption cc on m.id = cc.material_id
    where pr.product_id = p_product_id
    and (pr.match_condition is null or p_variants @> pr.match_condition)
  )
  
  -- 2. Find Limiting Material
  select 
    min(floor(available_stock / quantity_required)::int),
    bool_or((available_stock / quantity_required)::int <= safety_stock)
  into v_max_quantity, v_is_low_stock
  from effective_stock;

  if v_max_quantity is null then
    return jsonb_build_object('max_quantity', 9999, 'is_low_stock', false);
  end if;

  if v_max_quantity < 0 then v_max_quantity := 0; end if;

  return jsonb_build_object(
    'max_quantity', coalesce(v_max_quantity, 9999), 
    'is_low_stock', coalesce(v_is_low_stock, false)
  );
end;
$$;

-- Auto Deduct Trigger
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
      where product_id = (item->>'productId') -- Direct Text Match
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

create trigger trigger_deduct_inventory
  after insert on orders
  for each row
  execute function auto_deduct_inventory();
