-- 1. Add sold_quantity column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_quantity INT DEFAULT 0;

-- 2. Function to auto-increment sold_quantity
CREATE OR REPLACE FUNCTION auto_update_sold_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item jsonb;
  qty int;
BEGIN
  -- Iterate through items in the new order
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    -- Extract quantity (handle string/number difference just in case)
    qty := (item->>'quantity')::int;
    
    -- Update product sold_quantity
    UPDATE products
    SET sold_quantity = sold_quantity + qty
    WHERE id = (item->>'productId')::text; -- productId is stored as string in JSON usually, match against text id or uuid? products.id is text (prod_xxx)
  END LOOP;
  RETURN NEW;
END;
$$;

-- 3. Create Trigger on orders table
DROP TRIGGER IF EXISTS trigger_update_sold_quantity ON orders;
CREATE TRIGGER trigger_update_sold_quantity
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_sold_quantity();
