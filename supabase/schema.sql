-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Products Table
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  detailed_description text,
  price int not null, 
  price_description text,
  image_url text,           -- Path to the main thumbnail
  config_schema jsonb,      -- Stores the 'fields' array (customization options)
  pricing_logic jsonb,      -- Stores special pricing rules (e.g. { "double_sided_extra": 51 })
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
alter table products enable row level security;

-- 3. Create Policies
-- Allow anyone (public) to READ active products
create policy "Public Read Active Products" 
on products for select 
using (is_active = true);

-- Allow Service Role (Admin/Backend) to do EVERYTHING
-- Note: Service role bypasses RLS by default, but this makes it explicit if you use the authenticated admin user later.
create policy "Admin Full Access"
on products for all 
using (auth.role() = 'service_role');

-- (Optional) If you want to use the Supabase Dashboard User to edit, you might need:
-- create policy "Dashboard Admin" on products for all using (auth.uid() = 'your-user-id');
