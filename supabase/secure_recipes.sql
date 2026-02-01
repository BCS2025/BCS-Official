-- SECURE RECIPES (Optional but recommended)
-- Ensures that if any frontend logic tries to read recipes, it is allowed (Read Only for Public)

alter table product_recipes enable row level security;

drop policy if exists "Public Read Recipes" on product_recipes;
create policy "Public Read Recipes" on product_recipes for select using (true);
