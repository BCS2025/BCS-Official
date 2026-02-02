-- Drop first to allow modifying return type signature
DROP FUNCTION IF EXISTS check_low_stock();

-- Recreate with ID as TEXT to handle non-UUID IDs (like 'mat_keychain_round')
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TABLE (
  id text, -- Changed from UUID to TEXT
  name text,
  current_stock int,
  safety_stock int
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id::text, -- Cast to TEXT to be safe
    m.name::text,
    m.current_stock::int,
    m.safety_stock::int
  FROM materials m
  WHERE m.current_stock < m.safety_stock;
END;
$$;

GRANT EXECUTE ON FUNCTION check_low_stock() TO anon, authenticated;
