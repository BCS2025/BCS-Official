-- notification_failures：記錄 webhook 重試耗盡後仍失敗的通知，供後台手動補查或補送
-- 執行環境：Supabase SQL Editor（以 service_role 或 postgres 執行）

CREATE TABLE IF NOT EXISTS notification_failures (
    id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    context    text        NOT NULL,              -- 識別標籤，e.g. 'order_notify', 'low_stock_alert'
    payload    jsonb       NOT NULL,              -- 原始 webhook payload
    failed_at  timestamptz NOT NULL DEFAULT now(),
    resolved   boolean     NOT NULL DEFAULT false -- 手動標記為已處理
);

-- 啟用 RLS
ALTER TABLE notification_failures ENABLE ROW LEVEL SECURITY;

-- 前端（anon key）僅可 INSERT，不可讀取
CREATE POLICY "anon_can_insert" ON notification_failures
    FOR INSERT
    WITH CHECK (true);

-- 禁止 anon SELECT（資料僅限後台 service_role 查詢）
CREATE POLICY "block_anon_select" ON notification_failures
    FOR SELECT
    USING (false);

-- 索引：依 resolved 狀態快速撈取待處理項目
CREATE INDEX IF NOT EXISTS idx_notification_failures_unresolved
    ON notification_failures (resolved, failed_at DESC)
    WHERE resolved = false;
