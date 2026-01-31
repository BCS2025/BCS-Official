-- Advanced Stock Calculation with Cart Context
-- Calculates max addable quantity considering what's already in the cart.

create or replace function calculate_max_stock(
  p_product_id text,
  p_variants jsonb,
  p_cart_items jsonb default '[]'::jsonb
)
returns jsonb -- Changed return type to JSONB
language plpgsql
security definer
as $$
declare
  v_real_product_id uuid;
  v_max_quantity int;
  v_is_low_stock boolean;
begin
  -- 0. Resolve Product ID
  select id into v_real_product_id from products where slug = p_product_id;
  
  if v_real_product_id is null then
    begin
      v_real_product_id := p_product_id::uuid;
    exception when others then
      -- Product not found/tracked -> Unlimited, Low Stock False
      return jsonb_build_object('max_quantity', 9999, 'is_low_stock', false);
    end;
  end if;

  if v_real_product_id is null then
    return jsonb_build_object('max_quantity', 9999, 'is_low_stock', false);
  end if;

  -- 1. Calculate Consumption & Effective Stock
  with cart_consumption as (
    select 
      r.material_id,
      sum((cart_item->>'quantity')::int * r.quantity_required) as consumed_qty
    from jsonb_array_elements(p_cart_items) as cart_item
    join products p on p.slug = (cart_item->>'productId') or p.id::text = (cart_item->>'productId')
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
    bool_or((available_stock / quantity_required)::int <= safety_stock) -- If ANY material is low, flag it? Or just the limiting one?
    -- Actually, we care if the limiting factor is low. 
    -- But simplifies: if ANY required material is below safety stock relative to this product usage, show warning.
    -- Or strictly: is the resulting max_quantity <= (safety_stock / qty_required)?
    -- Let's use: If the material determining the limit is below its safety stock.
  into v_max_quantity, v_is_low_stock
  from effective_stock;

  -- Handle cases
  if v_max_quantity is null then
    return jsonb_build_object('max_quantity', 9999, 'is_low_stock', false);
  end if;

  if v_max_quantity < 0 then 
    v_max_quantity := 0; 
  end if;
  
  -- Re-evaluate is_low_stock specifically for the limiting factor
  -- (Simple logic: if max qty < 10, it's low. But user said safety_stock.)
  -- Let's trust the query above: `bool_or` might be too aggressive if a non-limiting material is low?
  -- No, if a material is low, we might want to warn. 
  -- But specifically: User wants "If current_stock > safety_stock -> Sufficient".
  -- So we should check the `min(...)`.
  
  -- Refined Query for Limiting Factor
  with stock_calc as (
     select 
       (es.available_stock / es.quantity_required)::int as possible_qty,
       es.available_stock,
       es.safety_stock
     from effective_stock es
  )
  select 
    min(possible_qty),
    -- Check if the item defining the min is below safety
    -- Rough approximation: if max_quantity is low.
    -- Let's stick to: If max_quantity <= 10 (hardcoded fallback) OR checking the specific material?
    -- Let's use the DB safety stock.
    exists (
       select 1 from stock_calc 
       where possible_qty = (select min(possible_qty) from stock_calc)
       and available_stock <= safety_stock
    )
  into v_max_quantity, v_is_low_stock
  from stock_calc;

  return jsonb_build_object(
    'max_quantity', coalesce(v_max_quantity, 9999), 
    'is_low_stock', coalesce(v_is_low_stock, false)
  );
end;
$$;
