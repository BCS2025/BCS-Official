-- Advanced Stock Calculation with Cart Context
-- Calculates max addable quantity considering what's already in the cart.

create or replace function calculate_max_stock(
  p_product_id uuid,
  p_variants jsonb,
  p_cart_items jsonb default '[]'::jsonb
)
returns int
language plpgsql
security definer
as $$
declare
  max_quantity int;
begin
  -- 1. Calculate the hypothetical remaining stock for each material
  --    after subtracting what's currently in the cart.
  
  with cart_consumption as (
    -- Unroll cart items and find which materials they consume
    select 
      r.material_id,
      sum((cart_item->>'quantity')::int * r.quantity_required) as consumed_qty
    from jsonb_array_elements(p_cart_items) as cart_item
    join product_recipes r on r.product_id = (cart_item->>'productId')::uuid
    where (r.match_condition is null or cart_item @> r.match_condition)
    group by r.material_id
  ),
  
  effective_stock as (
    -- Material Stock - Cart Consumption
    select
      m.id as material_id,
      m.current_stock - coalesce(cc.consumed_qty, 0) as available_stock
    from materials m
    left join cart_consumption cc on m.id = cc.material_id
  )

  -- 2. Calculate the limiting factor for the TARGET product variant
  --    based on the effective_stock calculated above.
  select min(floor(es.available_stock / pr.quantity_required)::int)
  into max_quantity
  from product_recipes pr
  join effective_stock es on pr.material_id = es.material_id
  where pr.product_id = p_product_id
  and (pr.match_condition is null or p_variants @> pr.match_condition);

  -- Handle cases
  -- If product has no recipes (not tracked), return 9999.
  if max_quantity is null then
    return 9999;
  end if;

  -- Ensure we don't return negative numbers if cart already exceeds stock
  if max_quantity < 0 then
    return 0;
  end if;

  return max_quantity;
end;
$$;
