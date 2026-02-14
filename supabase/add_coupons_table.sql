-- Create Coupons Table
create table if not exists coupons (
  code text primary key, -- Uppercase forced in logic usually, but here CI/AI logic applies
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount', 'free_shipping')),
  value numeric default 0, -- Store 10 for 10%, or 100 for $100 off
  min_spend numeric default 0,
  target_type text default 'all' check (target_type in ('all', 'product_specific')),
  target_product_ids jsonb default '[]'::jsonb, -- Array of product IDs
  start_date timestamptz not null default now(),
  end_date timestamptz,
  usage_limit int default null, -- NULL means unlimited
  used_count int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists coupons_code_idx on coupons (code);

-- RLS Policies
alter table coupons enable row level security;

-- Admin can do everything
create policy "Admins can manage coupons"
  on coupons
  for all
  to authenticated
  using (auth.email() = 'admin@bcs.tw') -- Or your specific admin check logic
  with check (auth.email() = 'admin@bcs.tw');

-- Public can READ ONLY active coupons (Actually, for security, maybe only read specific code?)
-- Better practice: Use a secure RPC, but for now we'll allow select IF we want frontend to browse codes? 
-- No, usually codes are secret. But we need to "validate" them.
-- Strategy: Allow SELECT for everyone, but we filter by code in the query.
-- OR: Use a Security Definer function to validate code so users can't list all codes.

-- For Simplicity & MVP: Allow Read access to everyone (so checkout can query), but maybe we rely on an EXACT match query in frontend?
-- RLS doesn't easily filter "only exact match". 
-- Let's stick to: Authenticated (Admin) sees all. Public can see "Active" coupons? 
-- Actually, if we allow public select, anyone can dump the table.
-- BETTTER: Create an RPC function `validate_coupon` and DISABLE public select on table.

-- Create RPC for safe validation
create or replace function validate_coupon(p_code text)
returns jsonb
language plpgsql
security definer -- Bypass RLS
as $$
declare
  v_coupon coupons%rowtype;
begin
  select * into v_coupon
  from coupons
  where lower(code) = lower(p_code)
  and is_active = true
  and (start_date <= now())
  and (end_date is null or end_date >= now())
  and (usage_limit is null or used_count < usage_limit);

  if not found then
    return '{"valid": false, "reason": "無效或已過期的優惠碼"}'::jsonb;
  end if;

  return jsonb_build_object(
    'valid', true,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'value', v_coupon.value,
    'min_spend', v_coupon.min_spend,
    'target_type', v_coupon.target_type,
    'target_product_ids', v_coupon.target_product_ids
  );
end;
$$;

-- Increment Usage RPC
create or replace function increment_coupon_usage(p_code text)
returns void
language plpgsql
security definer
as $$
begin
  update coupons
  set used_count = used_count + 1
  where lower(code) = lower(p_code);
end;
$$;

-- Allow Admin full access (Admin usually uses the client with an authenticated user)
-- Since we are using simple email check in other places, let's consistency.
-- Note: You might need to adjust the RLS policy if your admin login logic differs.
