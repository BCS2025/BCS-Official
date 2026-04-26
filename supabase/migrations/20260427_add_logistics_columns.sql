-- ============================================================
-- Phase 6.0 — 綠界物流整合 schema
-- 日期：2026-04-27
-- 執行方式：Supabase Dashboard > SQL Editor > 貼上執行
-- 範圍：orders 表新增 11 欄位（C2C 賣貨便 + 黑貓 + 中華郵政共用）
-- ============================================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS cvs_store_id        TEXT,
    ADD COLUMN IF NOT EXISTS cvs_store_name      TEXT,
    ADD COLUMN IF NOT EXISTS cvs_store_brand     TEXT,
    ADD COLUMN IF NOT EXISTS cvs_store_address   TEXT,
    ADD COLUMN IF NOT EXISTS logistics_id        TEXT,
    ADD COLUMN IF NOT EXISTS logistics_sub_type  TEXT,
    ADD COLUMN IF NOT EXISTS logistics_status    TEXT,
    ADD COLUMN IF NOT EXISTS logistics_status_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS logistics_message   TEXT,
    ADD COLUMN IF NOT EXISTS shipment_no         TEXT,
    ADD COLUMN IF NOT EXISTS payment_no          TEXT;

COMMENT ON COLUMN orders.cvs_store_id        IS '超商店號（綠界 CVSStoreID）';
COMMENT ON COLUMN orders.cvs_store_name      IS '超商店名（綠界 CVSStoreName）';
COMMENT ON COLUMN orders.cvs_store_brand     IS '超商品牌：UNIMARTC2C | FAMIC2C | HILIFEC2C | OKMARTC2C';
COMMENT ON COLUMN orders.cvs_store_address   IS '超商門市地址（綠界 CVSAddress）';
COMMENT ON COLUMN orders.logistics_id        IS '綠界物流訂單編號（建單後回傳的 AllPayLogisticsID）';
COMMENT ON COLUMN orders.logistics_sub_type  IS '物流子類型：UNIMARTC2C | FAMIC2C | HILIFEC2C | OKMARTC2C | TCAT | POST';
COMMENT ON COLUMN orders.logistics_status    IS '綠界物流狀態碼（webhook 與主動查詢同步）';
COMMENT ON COLUMN orders.logistics_status_at IS '物流狀態最後更新時間';
COMMENT ON COLUMN orders.logistics_message   IS '物流狀態訊息（綠界 RtnMsg / 描述）';
COMMENT ON COLUMN orders.shipment_no         IS '寄件單號：賣貨便寄件代碼 | 黑貓託運單號 | 郵政掛號號碼';
COMMENT ON COLUMN orders.payment_no          IS '繳款代碼（C2C 賣貨便專用，自送門市時繳交費用用）';

-- 索引：依 logistics_id 反查訂單（webhook 收到時用）
CREATE INDEX IF NOT EXISTS idx_orders_logistics_id
    ON orders (logistics_id)
    WHERE logistics_id IS NOT NULL;
