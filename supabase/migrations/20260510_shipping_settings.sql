-- ============================================================
-- 物流設定後台化 — Supabase Migration
-- 日期：2026-05-10
-- 執行方式：Supabase Dashboard > SQL Editor > 貼上執行
-- 範圍：
--   1. 新增 shipping_methods 表（取代寫死的 SHIPPING_METHODS 常數）
--   2. products 表新增 allowed_shipping_methods 欄位（商品層級限制）
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. 新增表：shipping_methods（物流類型與運費／免運門檻設定）
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shipping_methods (
    id                       TEXT        PRIMARY KEY,
    name                     TEXT        NOT NULL,
    description              TEXT,
    icon                     TEXT,
    price                    INTEGER     NOT NULL DEFAULT 0,
    free_shipping_threshold  INTEGER,           -- NULL = 該物流不適用滿額免運
    is_active                BOOLEAN     NOT NULL DEFAULT TRUE,
    sort_order               INTEGER     NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ DEFAULT now(),
    updated_at               TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  shipping_methods                          IS '物流類型設定（運費、免運門檻、上下架）';
COMMENT ON COLUMN shipping_methods.id                       IS '物流代碼：store | tcat | post | pickup';
COMMENT ON COLUMN shipping_methods.icon                     IS 'lucide icon 名稱（前端對應）：Store | Truck | Mail | MapPin';
COMMENT ON COLUMN shipping_methods.price                    IS '基本運費（NT$）';
COMMENT ON COLUMN shipping_methods.free_shipping_threshold  IS '滿額免運門檻；NULL = 不適用免運活動';
COMMENT ON COLUMN shipping_methods.is_active                IS '是否啟用（前台顯示與否）';
COMMENT ON COLUMN shipping_methods.sort_order               IS '顯示排序（小到大）';

-- updated_at 自動更新（沿用現有 update_updated_at function）
DROP TRIGGER IF EXISTS shipping_methods_updated_at ON shipping_methods;
CREATE TRIGGER shipping_methods_updated_at
    BEFORE UPDATE ON shipping_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS：公開讀取啟用中的物流，認證後完整存取
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shipping_methods_public_read" ON shipping_methods;
DROP POLICY IF EXISTS "shipping_methods_admin_all"   ON shipping_methods;

CREATE POLICY "shipping_methods_public_read"
    ON shipping_methods FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "shipping_methods_admin_all"
    ON shipping_methods FOR ALL
    USING (auth.role() = 'authenticated');

-- 種子資料（與既有 ShippingMethodSelector.jsx 中的設定一致；免運門檻先沿用 599）
-- 後台可後續修改各筆運費與門檻
INSERT INTO shipping_methods (id, name, description, icon, price, free_shipping_threshold, is_active, sort_order)
VALUES
    ('store',  '超商店到店', '7-11 / 全家 / 萊爾富 / OK，線上選店', 'Store',  60,  599,  TRUE, 10),
    ('tcat',   '黑貓宅配',   '本島 1–2 天，常溫包裹',                'Truck',  180, NULL, TRUE, 20),
    ('post',   '中華郵政',   '郵局包裹，本島 2–3 天',                'Mail',   80,  NULL, TRUE, 30),
    ('pickup', '自取',       '全家永康勝華店 / 7-11 北園門市',        'MapPin', 0,   NULL, TRUE, 40)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. products：新增允許物流欄位（商品層級限制）
-- ────────────────────────────────────────────────────────────

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS allowed_shipping_methods JSONB
    NOT NULL DEFAULT '["store","post","pickup"]'::jsonb;

COMMENT ON COLUMN products.allowed_shipping_methods
    IS '商品允許的物流方式 ID 陣列；預設 [store, post, pickup]，不含 tcat（黑貓）。新增大件商品時管理員可自行加入 tcat。';

-- 既有商品也統一補上預設值（DEFAULT 已處理新欄位 NULL 情況，但保險起見明確 update 一次）
UPDATE products
SET allowed_shipping_methods = '["store","post","pickup"]'::jsonb
WHERE allowed_shipping_methods IS NULL
   OR allowed_shipping_methods = 'null'::jsonb;
