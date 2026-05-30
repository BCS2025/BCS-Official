-- NUCLEAR OPTION: Temporarily DISABLE Row Level Security on the orders table.
-- This effectively makes the table public for writing (depending on Grants), removing the Policy check entirely.

alter table orders disable row level security;

-- Ensure permissions are still granted (even without RLS, basic Table permissions apply)
grant insert, select on table orders to anon;
grant insert, select on table orders to authenticated;
grant all on table orders to service_role;
