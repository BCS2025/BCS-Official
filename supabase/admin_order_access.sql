-- Allow Authenticated Users (Admins) to VIEW all orders
-- This is necessary for the Admin Dashboard Order List

-- 1. Drop existing policy if valid to avoid conflicts (though we previously only had Service Role policy)
DROP POLICY IF EXISTS "Allow Authenticated Select" ON orders;

-- 2. Create Policy
CREATE POLICY "Allow Authenticated Select"
ON orders FOR SELECT
TO authenticated
USING (true); -- Allow reading ALL rows
