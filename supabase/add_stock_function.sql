-- Function to calculate max stock for a specific product configuration
create or replace function calculate_max_stock(
  p_product_id uuid,
  p_variants jsonb
)
returns int
language plpgsql
security definer
as $$
declare
  max_quantity int;
begin
  -- Calculate the maximum number of units that can be produced
  -- by finding the LIMITING FACTOR among all required materials.
  
  select min(floor(m.current_stock / pr.quantity_required)::int)
  into max_quantity
  from product_recipes pr
  join materials m on pr.material_id = m.id
  where pr.product_id = p_product_id
  -- Match rules:
  -- 1. Recipe has NO condition (Always required)
  -- 2. OR Recipe condition is contained in the User's Selection
  and (pr.match_condition is null or p_variants @> pr.match_condition);

  -- If no recipes match (product doesn't track inventory), return null (or a high number)
  -- We'll return 9999 to indicate "Plenty/Unlimited"
  if max_quantity is null then
    return 9999;
  end if;

  return max_quantity;
end;
$$;
