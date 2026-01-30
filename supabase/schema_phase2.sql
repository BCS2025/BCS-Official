-- 1. Create Orders Table
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_id text unique not null,         -- Readable ID (e.g. ORD-123456)
  user_info jsonb not null,              -- Stores address, phone, name, etc.
  items jsonb not null,                  -- Array of purchased items with configs
  total_amount int not null,
  status text default 'pending',         -- pending, paid, shipped, cancelled
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Orders
alter table orders enable row level security;

-- Policies for Orders
-- ALLOW Public Create (Anyone can submit an order)
create policy "Public Create Order" 
on orders for insert 
with check (true);

-- ALLOW User Read (Only their own orders?) - For now, maybe just Admin read?
-- Let's stick to Admin Read for safety, unless we implement auth later.
create policy "Admin Read All Orders"
on orders for select
using (auth.role() = 'service_role');


-- 2. Storage Setup (Code-based setup)
-- Attempt to insert the bucket if it doesn't exist.
-- Note: checks if bucket exists to avoid errors.
insert into storage.buckets (id, name, public)
values ('order-uploads', 'order-uploads', true)
on conflict (id) do nothing;

-- Storage Policies
-- We need to allow public (unauthenticated) users to upload files for their orders.
-- Recommendation: Allow upload to a specific folder or just generally to this bucket.

-- Policy: Public Insert (Upload)
create policy "Public Upload"
on storage.objects for insert
with check ( bucket_id = 'order-uploads' );

-- Policy: Public Read (So admin/you can see the images)
create policy "Public Read"
on storage.objects for select
using ( bucket_id = 'order-uploads' );
