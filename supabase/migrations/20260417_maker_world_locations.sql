-- ============================================================
-- 創客世界：上課地點 CMS（可擴展至多合作單位）
-- 日期：2026-04-17
-- 執行方式：Supabase Dashboard > SQL Editor > 貼上執行
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. 新增表：class_locations（上課地點主檔）
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS class_locations (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT        NOT NULL,
    type         TEXT        DEFAULT 'studio',
    address      TEXT,
    map_url      TEXT,
    description  TEXT,
    cover_url    TEXT,
    is_active    BOOLEAN     DEFAULT TRUE,
    sort_order   INTEGER     DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  class_locations              IS '創客世界上課地點：工作室、合作單位、公共場所等';
COMMENT ON COLUMN class_locations.type         IS 'studio（工作室）| partner（合作單位）| library（圖書館）| community（救國團等）| online（線上）| other';
COMMENT ON COLUMN class_locations.is_active    IS '是否為目前合作中之地點，false 則不出現在前台地點介紹';
COMMENT ON COLUMN class_locations.sort_order   IS '前台顯示順序，數字越大越前面';

-- RLS
ALTER TABLE class_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "locations_public_read" ON class_locations;
DROP POLICY IF EXISTS "locations_admin_write" ON class_locations;
CREATE POLICY "locations_public_read" ON class_locations FOR SELECT USING (true);
CREATE POLICY "locations_admin_write" ON class_locations FOR ALL    USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- 2. 課程表：加入地點 FK
-- ────────────────────────────────────────────────────────────

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES class_locations(id) ON DELETE SET NULL;

COMMENT ON COLUMN courses.location_id IS '上課地點（FK class_locations.id），null 代表未設定';

-- ────────────────────────────────────────────────────────────
SELECT 'maker_world_locations migration completed' AS status;
