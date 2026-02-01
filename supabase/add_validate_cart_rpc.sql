-- VALIDATE CART STOCK (Pre-flight Check)
-- Returns details on WHICH items fail and WHY.

create or replace function validate_cart_stock(
  p_cart_items jsonb
)
returns table (
  product_id text,
  product_name text,
  reason text
)
language plpgsql
as $$
begin
  return query
  with cart_consumption as (
    select 
      r.material_id,
      sum((item->>'quantity')::int * r.quantity_required) as consumed_qty
    from jsonb_array_elements(p_cart_items) as item
    join product_recipes r on r.product_id = (item->>'productId')
    where (r.match_condition is null or item @> r.match_condition)
    group by r.material_id
  ),
  stock_status as (
    select
      m.id as material_id,
      m.name as material_name,
      m.current_stock,
      cc.consumed_qty
    from materials m
    join cart_consumption cc on cc.material_id = m.id
  ),
  failed_materials as (
    select 
      material_id, 
      material_name, 
      current_stock, 
      consumed_qty 
    from stock_status 
    where consumed_qty > current_stock
  )
  -- Find which products use the failed materials
  select distinct
    (item->>'productId')::text,
    (item->>'productName')::text,
    format('原料不足: %s (需求 %s, 庫存 %s)', fm.material_name, fm.consumed_qty, fm.current_stock)::text as reason
  from jsonb_array_elements(p_cart_items) as item
  join product_recipes r on r.product_id = (item->>'productId')
  join failed_materials fm on fm.material_id = r.material_id
  where (r.match_condition is null or item @> r.match_condition);

end;
$$;
