-- PERFORMANCE OPTIMIZATION
-- Adding indexes to speed up RLS checks and common queries.

-- 1. Products: Index for Filtering and Sorting
-- We filter by 'is_active' and sort by 'sort_order' constantly.
create index if not exists idx_products_active_sort on products(is_active, sort_order);

-- 2. Products: Index for ID lookups (Supabase creates PK index, but good to ensure)
-- create index if not exists idx_products_id on products(id);

-- 3. Product Recipes: Index for Foreign Keys (Crucial for joins)
-- When fetching products, checking recipes without this index is slow.
create index if not exists idx_product_recipes_product_id on product_recipes(product_id);
create index if not exists idx_product_recipes_material_id on product_recipes(material_id);

-- 4. Materials: Index for ID
-- create index if not exists idx_materials_id on materials(id);

-- 5. VACUUM ANALYZE (Commented out because it cannot run in Transaction Block)
-- VACUUM ANALYZE products;
-- VACUUM ANALYZE product_recipes;
-- VACUUM ANALYZE materials;

-- 6. Verify Policies (Ensure they are simple)
-- Complex functions in policies can cause huge lag. Ours are 'using (true)' or 'auth.role()=...', which is fast.
