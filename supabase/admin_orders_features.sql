-- 新增內部備註與垃圾桶(封存)功能的資料表擴充
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';
