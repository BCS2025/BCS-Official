-- Add pricing_logic column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS pricing_logic JSONB DEFAULT '{}'::jsonb;
