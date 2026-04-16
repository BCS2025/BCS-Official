/**
 * paymentService.js — 比創空間支付抽象層
 *
 * 架構設計原則（ADR-002）：
 * - 此檔案是整個專案唯一的金流入口
 * - Phase 1（現在）：回傳銀行轉帳資訊，人工確認
 * - Phase 2（未來）：只改此檔案即可接入 ECPay / NewebPay
 * - 禁止在其他元件直接寫付款邏輯
 */

/**
 * 發起付款
 *
 * @param {object} params
 * @param {string} params.orderId       - 訂單編號
 * @param {number} params.amount        - 應付金額（新台幣）
 * @param {string} params.customerEmail - 客戶 Email（未來金流寄送收據用）
 * @param {string} params.source        - 訂單來源 'store' | 'forge'
 *
 * @returns {Promise<PaymentResult>}
 *
 * PaymentResult（Phase 1）：
 * {
 *   method: 'bank_transfer',
 *   bank: string,
 *   account: string,
 *   amount: number,
 *   deadline: string,   // 付款期限，ISO date string
 * }
 *
 * PaymentResult（Phase 2，未來）：
 * {
 *   method: 'ecpay' | 'neweb',
 *   redirectUrl: string,  // 導向第三方付款頁
 * }
 */
export async function initiatePayment({ orderId, amount, customerEmail, source }) {
    // ── Phase 1：銀行轉帳（手動確認）──────────────────────────────
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3); // 3 天付款期限

    return {
        method: 'bank_transfer',
        bank: import.meta.env.VITE_PAYMENT_BANK_NAME || '（請於 Vercel 環境變數設定 VITE_PAYMENT_BANK_NAME）',
        account: import.meta.env.VITE_PAYMENT_ACCOUNT || '（請於 Vercel 環境變數設定 VITE_PAYMENT_ACCOUNT）',
        amount,
        orderId,
        deadline: deadline.toLocaleDateString('zh-TW'),
    };

    // ── Phase 2（未來解除註解，並移除上方 Phase 1 區塊）───────────
    // const ecpayResult = await createEcpayOrder({ orderId, amount, customerEmail });
    // return {
    //     method: 'ecpay',
    //     redirectUrl: ecpayResult.paymentUrl,
    // };
}

/**
 * 處理金流回呼（付款成功 Webhook）
 *
 * Phase 1：無實作（人工確認後在後台手動標記）
 * Phase 2：驗簽 → 更新 orders.payment_status = 'paid' → 觸發通知
 *
 * @param {object} payload - 金流平台回傳的 raw payload
 * @returns {Promise<{ success: boolean, orderId: string }>}
 */
export async function handlePaymentCallback(payload) {
    // Phase 2 實作位置
    console.warn('[paymentService] handlePaymentCallback 尚未實作（Phase 2）');
    return { success: false, orderId: null };
}

/**
 * 取得付款狀態說明文字（用於 UI 顯示）
 *
 * @param {string} paymentStatus - 'pending' | 'paid' | 'failed'
 * @returns {string}
 */
export function getPaymentStatusLabel(paymentStatus) {
    const labels = {
        pending: '待付款',
        paid:    '已付款',
        failed:  '付款失敗',
    };
    return labels[paymentStatus] ?? '未知';
}
