-- 1. Create Quote Materials Table
create table quote_materials (
  id uuid primary key default uuid_generate_v4(),
  method text not null check (method in ('laser', '3dprint')),
  name text not null,
  sort_order int default 10,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable RLS
alter table quote_materials enable row level security;

-- 3. RLS Policies
-- Public Read Access
create policy "Allow public read access on quote_materials"
  on quote_materials for select
  to public
  using (is_active = true);

-- Admin CRUD Access (Requires admin email check)
create policy "Allow admin full access on quote_materials"
  on quote_materials for all
  to authenticated
  using (
    auth.jwt() ->> 'email' in ('bcs.creativespace@gmail.com', 'admin@bcs.tw', 'lin210082@gmail.com')
  )
  with check (
    auth.jwt() ->> 'email' in ('bcs.creativespace@gmail.com', 'admin@bcs.tw', 'lin210082@gmail.com')
  );

-- 4. Initial Seed Data
insert into quote_materials (method, name, sort_order) values
  ('laser', '夾板 (Plywood) 3mm', 10),
  ('laser', '夾板 (Plywood) 5mm', 20),
  ('laser', '密集板 (MDF) 3mm', 30),
  ('laser', '密集板 (MDF) 5mm', 40),
  ('laser', '壓克力 (Acrylic) 透明', 50),
  ('laser', '壓克力 (Acrylic) 黑', 60),
  ('laser', '壓克力 (Acrylic) 白', 70),
  ('laser', '皮革合成材 (Leather)', 80),

  ('3dprint', 'PLA (一般環境使用，標準列印)', 10),
  ('3dprint', 'PETG (耐溫性較佳，具有韌性)', 20),
  ('3dprint', 'TPU (彈性材質，防滑避震用)', 30),
  ('3dprint', 'ABS (高硬度高耐溫，需封閉成型)', 40);
