-- RESTORE RLS SAFETY (Read Only for Public)
-- This secures the table so random visitors cannot DELETE/UPDATE your products.

-- 1. Enable RLS on Products
alter table products enable row level security;

-- 2. Ensure Public Read Policy exists (and is the ONLY one for anon)
drop policy if exists "Public Read Products" on products;
create policy "Public Read Products" on products for select using (true);

-- NOTE: Currently, we do NOT have an "Admin Write" policy because we haven't set up Supabase Auth Users yet.
-- This means the Admin Dashboard will be able to VIEW products, but 'Save' might fail until we do the next step (Login System).

-- 3. (Optional) Secure Materials as well
alter table materials enable row level security;
drop policy if exists "Public Read Materials" on materials;
create policy "Public Read Materials" on materials for select using (true);
-- Note: validate_cart_stock RPC usually bypasses RLS if it's Security Definer, so we are safe there.
