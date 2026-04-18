import { notifyGAS } from './webhookService';

/**
 * 送出客服詢問。沿用既有 GAS webhook（含重試 + Supabase fallback）。
 * 注意：因為 webhookService 採 mode:'no-cors'，此函式視為「fire-and-forget」，
 * 無法從前端拿到 GAS 應用層回應。網路層失敗才會 throw。
 *
 * @param {object} payload - InquiryWidget 組裝好的 payload（type:'inquiry'）
 */
export async function submitInquiry(payload) {
    return notifyGAS(payload, 'inquiry');
}
