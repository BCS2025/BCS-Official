/**
 * 物流 callback URL helpers
 *
 * 優先順序：
 *   1. 顯式 env var（VITE_LOGISTICS_REPLY_URL / VITE_LOGISTICS_STATUS_WEBHOOK_URL）
 *   2. 由 request header 推導（適合 preview 部署，URL 自動跟隨 deployment）
 *   3. VITE_SITE_URL（最後 fallback）
 */

export function deriveBaseUrl(req) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (!host) return process.env.VITE_SITE_URL || 'https://bcs.tw';
    return `${proto}://${host}`;
}

export function getReplyUrl(req) {
    if (process.env.VITE_LOGISTICS_REPLY_URL) {
        return process.env.VITE_LOGISTICS_REPLY_URL;
    }
    return `${deriveBaseUrl(req)}/api/logistics/select-store-callback`;
}

export function getStatusWebhookUrl(req) {
    if (process.env.VITE_LOGISTICS_STATUS_WEBHOOK_URL) {
        return process.env.VITE_LOGISTICS_STATUS_WEBHOOK_URL;
    }
    return `${deriveBaseUrl(req)}/api/logistics/status-webhook`;
}
