ALTER TABLE products ADD COLUMN IF NOT EXISTS needs_proof BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_file_upload BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN products.needs_proof IS '是否需製作前對稿確認';
COMMENT ON COLUMN products.requires_file_upload IS '商品頁是否提供客戶上傳檔案欄位（needs_proof=true 才生效）';

UPDATE products SET needs_proof = true, requires_file_upload = true
WHERE id IN ('prod_keychain_custom','prod_nightlight_custom','prod_coaster_custom','prod_custom_01');
