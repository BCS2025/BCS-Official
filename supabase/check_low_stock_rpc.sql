-- Secure Remote Procedure Call (RPC) for checking low stock materials
-- This function allows the frontend to check inventory without direct table access (bypassing RLS safely)
-- It returns ONLY the materials that need attention (Low Stock or Out of Stock)

CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TABLE (
  id uuid,
  name text,
  current_stock int,
  safety_stock int
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.current_stock,
    m.safety_stock
  FROM materials m
  WHERE m.current_stock < m.safety_stock;
END;
$$;

-- Grant access to public (anon) and logged-in users (authenticated)
GRANT EXECUTE ON FUNCTION check_low_stock() TO anon, authenticated;
