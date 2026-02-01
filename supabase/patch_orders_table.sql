-- PATCH: Align Orders Table with Frontend Logic
-- Fixes "Could not find column" errors during checkout

-- 1. Add order_id (Text ID like 'ORD-123456')
alter table orders add column if not exists order_id text;

-- 2. Rename customer_info -> user_info (Frontend sends user_info)
do $$
begin
  if exists(select 1 from information_schema.columns where table_name='orders' and column_name='customer_info') then
    alter table orders rename column customer_info to user_info;
  end if;
end $$;

-- 3. Rename amount -> total_amount (Frontend sends total_amount)
do $$
begin
  if exists(select 1 from information_schema.columns where table_name='orders' and column_name='amount') then
    alter table orders rename column amount to total_amount;
  end if;
end $$;

-- 4. Drop item_name (Legacy column, unnecessary with 'items' JSONB)
alter table orders drop column if exists item_name;
