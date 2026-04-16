-- ============================================================
-- 創客世界：種子資料（可重複執行，以 title/name 判斷是否存在）
-- 日期：2026-04-17
-- 前置：請先執行 migrations/20260417_maker_world_locations.sql
-- 執行方式：Supabase Dashboard > SQL Editor > 貼上執行
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. 地點（目前合作中 1 個 + 自有工作室 1 個；其餘之後再補）
-- ────────────────────────────────────────────────────────────

INSERT INTO class_locations (name, type, address, description, is_active, sort_order)
SELECT '比創空間工作室', 'studio', '台南市永康區新興街 34 巷 2 號', '比創空間自有教學工作室，擁有 3D 列印機、雷射切割機、Arduino 實作設備。', TRUE, 100
WHERE NOT EXISTS (SELECT 1 FROM class_locations WHERE name = '比創空間工作室');

INSERT INTO class_locations (name, type, address, description, is_active, sort_order)
SELECT '珍優英文家教班', 'partner', '台南市', '合作家教班定期開設 STEAM 課程，讓孩子在熟悉的學習環境中接觸動手實作。', TRUE, 80
WHERE NOT EXISTS (SELECT 1 FROM class_locations WHERE name = '珍優英文家教班');

-- ────────────────────────────────────────────────────────────
-- 2. 課程資料
--    注意：4/11 課程的 gallery_urls 指向 public/makerworld_ClassPhoto 下的圖檔，
--         等未來後台批次上傳至 Supabase Storage 後，可由後台編輯覆寫。
-- ────────────────────────────────────────────────────────────

-- 2-1 已結束：4/11（六）城市縮小燈
INSERT INTO courses (title, description, date, duration_min, min_age, max_age, capacity, enrolled, price, status, gallery_urls, location_id)
SELECT
    '城市縮小燈：3D 列印筆蓋出建築物',
    E'用 3D 列印筆蓋出屬於自己的迷你建築，搭配 LED 底座點亮城市模型。\n課程涵蓋 3D 建模概念、立體想像、電路入門。',
    '2026-04-11 14:00:00+08'::timestamptz,
    150,
    8, 14,
    10, 10,
    600,
    'closed',
    ARRAY[
        '/makerworld_ClassPhoto/20260411_01.jpg',
        '/makerworld_ClassPhoto/20260411_02.jpg',
        '/makerworld_ClassPhoto/20260411_03.jpg',
        '/makerworld_ClassPhoto/20260411_04.jpg',
        '/makerworld_ClassPhoto/20260411_05.jpg',
        '/makerworld_ClassPhoto/20260411_06.jpg'
    ]::TEXT[],
    (SELECT id FROM class_locations WHERE name = '比創空間工作室' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = '城市縮小燈：3D 列印筆蓋出建築物');

-- 2-2 即將開課：4/25（六）風暴傳動
INSERT INTO courses (title, description, date, duration_min, min_age, max_age, capacity, enrolled, price, status, location_id)
SELECT
    '風暴傳動：齒輪箱大挑戰',
    E'以齒輪組合探索機械傳動原理，動手組裝一台可動齒輪箱模型。\n認識齒輪比、傳動方向、速比換算。',
    '2026-04-25 14:00:00+08'::timestamptz,
    150,
    8, 14,
    10, 0,
    650,
    'open',
    (SELECT id FROM class_locations WHERE name = '比創空間工作室' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = '風暴傳動：齒輪箱大挑戰');

-- 2-3 即將開課：5/9（六）母親節特輯：立體卡片
INSERT INTO courses (title, description, date, duration_min, min_age, max_age, capacity, enrolled, price, status, location_id)
SELECT
    '母親節特輯：畫出立體卡片',
    E'用雷射切割與立體摺紙結合，打造會彈起的專屬母親節卡片。\n練習線稿設計、材料加工、色彩搭配。',
    '2026-05-09 14:00:00+08'::timestamptz,
    150,
    8, 14,
    10, 0,
    550,
    'open',
    (SELECT id FROM class_locations WHERE name = '比創空間工作室' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = '母親節特輯：畫出立體卡片');

-- 2-4 即將開課：5/23（六）怪手來了：液壓
INSERT INTO courses (title, description, date, duration_min, min_age, max_age, capacity, enrolled, price, status, location_id)
SELECT
    '怪手來了：液壓是這樣呀',
    E'用針筒與水管做出會動的液壓怪手，理解流體傳動的力量放大原理。\n結合 STEAM 科學概念與機構設計。',
    '2026-05-23 14:00:00+08'::timestamptz,
    150,
    8, 14,
    10, 0,
    650,
    'open',
    (SELECT id FROM class_locations WHERE name = '比創空間工作室' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = '怪手來了：液壓是這樣呀');

-- ────────────────────────────────────────────────────────────
-- 驗證
-- ────────────────────────────────────────────────────────────
SELECT
    (SELECT COUNT(*) FROM class_locations) AS locations_count,
    (SELECT COUNT(*) FROM courses)         AS courses_count;
