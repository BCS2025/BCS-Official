-- 1. Add slogan column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS slogan text;

-- 2. Migrate existing short descriptions to slogan if slogan is null (optional data cleanup)
-- Assuming some products used description as a slogan.
-- We can set a default or leave it empty for the admin to fill.
UPDATE products SET slogan = '實用與美感兼具，記錄生活的美好時刻。' WHERE id = 'prod_calendar_tile' AND slogan IS NULL;
UPDATE products SET slogan = '讓福、財、發為您開啟一整年的好運！' WHERE id = 'prod_couplets_3d' AND slogan IS NULL;
