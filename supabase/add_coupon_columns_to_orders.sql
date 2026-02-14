-- Add coupon columns to orders table
alter table orders 
add column if not exists coupon_code text,
add column if not exists discount_amount numeric default 0;

-- Optional: Add index for analytics
create index if not exists orders_coupon_code_idx on orders (coupon_code);
