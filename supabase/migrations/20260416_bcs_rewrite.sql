-- ============================================================
-- 比創空間官網全面重構 — Supabase Migration
-- 日期：2026-04-16
-- 執行方式：Supabase Dashboard > SQL Editor > 貼上執行
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. 修改現有表：orders（新增金流預留欄位 + 訂單來源）
-- ────────────────────────────────────────────────────────────

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS source          TEXT DEFAULT 'store',
    ADD COLUMN IF NOT EXISTS payment_method  TEXT DEFAULT 'bank_transfer',
    ADD COLUMN IF NOT EXISTS payment_status  TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS payment_ref     TEXT;

COMMENT ON COLUMN orders.source         IS '訂單來源：store（販創所）| forge（鍛造工坊）';
COMMENT ON COLUMN orders.payment_method IS '付款方式：bank_transfer | ecpay | neweb';
COMMENT ON COLUMN orders.payment_status IS '付款狀態：pending | paid | failed';
COMMENT ON COLUMN orders.payment_ref    IS '第三方金流交易編號（Phase 2 使用）';

-- ────────────────────────────────────────────────────────────
-- 2. 修改現有表：products（新增商品分類）
-- ────────────────────────────────────────────────────────────

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'creative';

COMMENT ON COLUMN products.category IS '商品分類：creative（創作商品）| materials（創客材料）';

-- ────────────────────────────────────────────────────────────
-- 3. 新增表：courses（創客世界課程 CMS）
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS courses (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT        NOT NULL,
    description   TEXT,
    cover_url     TEXT,
    gallery_urls  TEXT[]      DEFAULT '{}',
    date          TIMESTAMPTZ NOT NULL,
    duration_min  INTEGER     DEFAULT 120,
    min_age       INTEGER,
    max_age       INTEGER,
    capacity      INTEGER     DEFAULT 10,
    enrolled      INTEGER     DEFAULT 0,
    price         INTEGER     DEFAULT 0,
    status        TEXT        DEFAULT 'open',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE courses                IS '創客世界課程';
COMMENT ON COLUMN courses.status       IS 'open（開放報名）| full（額滿）| closed（已結束）';
COMMENT ON COLUMN courses.gallery_urls IS '課堂照片陣列，儲存 Supabase Storage 公開 URL';

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS courses_updated_at ON courses;
CREATE TRIGGER courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "courses_public_read"  ON courses;
DROP POLICY IF EXISTS "courses_admin_write"  ON courses;
CREATE POLICY "courses_public_read"  ON courses FOR SELECT USING (true);
CREATE POLICY "courses_admin_write"  ON courses FOR ALL    USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- 4. 新增表：registrations（課程報名）
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS registrations (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id     UUID        REFERENCES courses(id) ON DELETE CASCADE,
    parent_name   TEXT        NOT NULL,
    phone         TEXT        NOT NULL,
    email         TEXT,
    child_age     INTEGER,
    note          TEXT,
    status        TEXT        DEFAULT 'confirmed',
    created_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE registrations              IS '創客世界課程報名';
COMMENT ON COLUMN registrations.status     IS 'confirmed | attended | absent | cancelled';

-- RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "registrations_admin_only" ON registrations;
CREATE POLICY "registrations_admin_only" ON registrations FOR ALL USING (auth.role() = 'authenticated');

-- 報名時自動 +1 enrolled（防超額由應用層另行檢查）
CREATE OR REPLACE FUNCTION increment_enrolled()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses SET enrolled = enrolled + 1 WHERE id = NEW.course_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_registration_insert ON registrations;
CREATE TRIGGER on_registration_insert
    AFTER INSERT ON registrations
    FOR EACH ROW EXECUTE FUNCTION increment_enrolled();

-- ────────────────────────────────────────────────────────────
-- 5. 新增表：forge_portfolio（鍛造工坊作品集）
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forge_portfolio (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT        NOT NULL,
    description TEXT,
    image_url   TEXT        NOT NULL,
    material    TEXT,
    tags        TEXT[]      DEFAULT '{}',
    sort_order  INTEGER     DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE forge_portfolio            IS '鍛造工坊過去作品集';
COMMENT ON COLUMN forge_portfolio.material IS '雷射切割 | 3D列印 | 複合';
COMMENT ON COLUMN forge_portfolio.sort_order IS '排序權重，數字越大越前面';

-- RLS
ALTER TABLE forge_portfolio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portfolio_public_read"  ON forge_portfolio;
DROP POLICY IF EXISTS "portfolio_admin_write"  ON forge_portfolio;
CREATE POLICY "portfolio_public_read"  ON forge_portfolio FOR SELECT USING (true);
CREATE POLICY "portfolio_admin_write"  ON forge_portfolio FOR ALL    USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- 完成確認
-- ────────────────────────────────────────────────────────────
SELECT 'Migration completed successfully' AS status;
