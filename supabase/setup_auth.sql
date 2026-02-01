-- AUTH & POLICIES SETUP
-- This script secures the database and grants access to the Admin User.

-- 1. Enable RLS on all tables (Safety First)
alter table products enable row level security;
alter table materials enable row level security;
alter table product_recipes enable row level security;

-- 2. Define "Public Read" Policies (Anonymous Users can VIEW)
drop policy if exists "Public Read Products" on products;
create policy "Public Read Products" on products for select using (true);

drop policy if exists "Public Read Materials" on materials;
create policy "Public Read Materials" on materials for select using (true);

drop policy if exists "Public Read Recipes" on product_recipes;
create policy "Public Read Recipes" on product_recipes for select using (true);

-- 3. Define "Admin Full Access" Policies (Authenticated Users can EDIT)
-- For MVP, we allow ANY logged-in user to edit.
-- In the future, you can restrict this to specific emails (e.g., auth.jwt()->>'email' = 'admin@bcs.tw')

drop policy if exists "Admin All Products" on products;
create policy "Admin All Products" on products for all 
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Admin All Materials" on materials;
create policy "Admin All Materials" on materials for all 
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Admin All Recipes" on product_recipes;
create policy "Admin All Recipes" on product_recipes for all 
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- 4. Setup Storage Policies (Images)
-- Allow Public to View
-- Allow Admin to Upload
-- (Note: Storage policies are handled via Storage Dashboard usually, but SQL can do it too)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

-- Policy for Storage Select (Public)
-- create policy "Public Access" on storage.objects for select using ( bucket_id = 'product-images' );

-- Policy for Storage Insert (Admin)
-- create policy "Admin Upload" on storage.objects for insert with check ( bucket_id = 'product-images' and auth.role() = 'authenticated' );
