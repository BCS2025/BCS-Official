-- Add 'sort_order' column for custom sorting (Featured products)
-- Default is 0. Higher number = Higher priority (appears first).
alter table products 
add column if not exists sort_order int default 0;

-- Optional: Update existing products to have default 0 if null (though default handles new ones)
update products set sort_order = 0 where sort_order is null;
