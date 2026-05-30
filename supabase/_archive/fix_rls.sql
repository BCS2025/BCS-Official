-- Drop the old policy to avoid conflict or confusion
drop policy if exists "Public Create Order" on orders;

-- Create a more explicit policy for the 'anon' role (unauthenticated users)
create policy "Enable insert for anon (public) users"
on orders for insert
to anon
with check (true);

-- Also ensure 'service_role' has full access (usually default, but good to ensure)
create policy "Enable all access for service_role"
on orders for all
to service_role
using (true)
with check (true);
