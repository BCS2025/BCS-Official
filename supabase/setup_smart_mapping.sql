-- 1. ENHANCE PRODUCTS TABLE AS "MASTER MAPPING TABLE"
-- This column 'slug' acts as the English ID, while 'name' is the Chinese ID.
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'slug') then
        alter table products add column slug text unique;
    end if;
end $$;

-- 2. POPULATE MAPPING (Auto-Expand existing data)
-- We manually map known existing Chinese names to English slugs here.
-- FUTURE: When adding new products, just fill 'slug' and 'name'.
update products set slug = 'wooden-keychain' where name = '客製化木質鑰匙圈';
update products set slug = 'tile-night-light' where name = '花磚小夜燈';
update products set slug = 'spring-couplets' where name = '立體春聯';
update products set slug = 'wooden-coaster' where name = '客製化原木杯墊';
update products set slug = 'tile-calendar' where name = '花磚月曆';
update products set slug = 'night-light' where name = '客製化小夜燈';

-- 3. CREATE "UNIVERSAL RESOLVER" FUNCTION
-- This behaves like the "Translation Layer" the user requested.
-- It accepts ANY identifier (Chinese Name, English Slug, or UUID) and finds the ID.

create or replace function lookup_product_id(p_identifier text)
returns uuid
language plpgsql
stable
as $$
declare
  v_id uuid;
begin
  -- A. Try to find by English Slug (Preferred)
  select id into v_id from products where slug = p_identifier;
  if v_id is not null then return v_id; end if;

  -- B. Try to find by Chinese Name (Translation)
  select id into v_id from products where name = p_identifier;
  if v_id is not null then return v_id; end if;

  -- C. Try to interpret as UUID (Direct ID)
  begin
    v_id := p_identifier::uuid;
    return v_id;
  exception when others then
    return null; -- Not a UUID
  end;
end;
$$;

-- 4. UPDATE STOCK CALCULATION TO USE RESOLVER
create or replace function calculate_max_stock(
  p_product_id text, -- Can now be Name, Slug, or UUID
  p_variants jsonb,
  p_cart_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_real_product_id uuid;
  v_max_quantity int;
  v_is_low_stock boolean;
begin
  -- USE THE MAPPING RESOLVER
  v_real_product_id := lookup_product_id(p_product_id);

  if v_real_product_id is null then
    -- Product not found in Mapping Table -> Unlimited
    return jsonb_build_object('max_quantity', 9999, 'is_low_stock', false);
  end if;

  -- ... (Rest of the Logic remains identical: Calculate based on Recipe) ...
  
  -- 1. Calculate Consumption & Effective Stock
  with cart_consumption as (
    select 
      r.material_id,
      sum((cart_item->>'quantity')::int * r.quantity_required) as consumed_qty
    from jsonb_array_elements(p_cart_items) as cart_item
    -- Resolve Cart Item IDs using the SAME Resolver
    join products p on p.id = lookup_product_id(cart_item->>'productId') 
    join product_recipes r on r.product_id = p.id
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
    where pr.product_id = v_real_product_id
    and (pr.match_condition is null or p_variants @> pr.match_condition)
  )
  
  -- 2. Find the Limiting Material
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
