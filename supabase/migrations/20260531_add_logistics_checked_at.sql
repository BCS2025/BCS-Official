-- =============================================================================
-- 新增 orders.logistics_checked_at：query-status refresh 節流用
-- 日期：2026-05-31
-- 用途：
--   /api/logistics/query-status?refresh=true 會即時呼叫綠界查詢 API。
--   為避免被惡意刷爆（燒綠界額度 / 觸發綠界限流），記錄「上次真正查詢綠界的時間」，
--   同一訂單在節流秒數內重複 refresh 直接回 cache，不再打綠界。
--
-- 執行方式：貼到 Supabase → SQL Editor → Run。
-- 備註：query-status.js 對此欄位採「不存在則降級為不節流」，故先部署或先跑 migration 都不會壞，
--       但建議先跑 migration 再部署，節流才會即時生效。
-- =============================================================================

alter table orders add column if not exists logistics_checked_at timestamptz;

comment on column orders.logistics_checked_at is
  '上次真正向綠界查詢物流狀態的時間（query-status refresh 節流用）';
