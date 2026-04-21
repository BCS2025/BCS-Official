/**
 * paymentService.js — 比創空間金流唯一入口
 *
 * 支援：
 *   - bank_transfer：匯款資訊靜態顯示在感謝頁
 *   - line_pay：走 /api/linepay/* Serverless Functions
 */

export const PAYMENT_METHODS = {
    BANK_TRANSFER: 'bank_transfer',
    LINE_PAY: 'line_pay',
};

export function getBankTransferInfo() {
    return {
        bank: import.meta.env.VITE_PAYMENT_BANK_NAME || '中華郵政 (700)',
        account: import.meta.env.VITE_PAYMENT_ACCOUNT || '0031421-0318644',
        accountName: import.meta.env.VITE_PAYMENT_ACCOUNT_NAME || '黃詣',
    };
}

/**
 * 發起付款
 *
 * @param {object} params
 * @param {string} params.orderId       - 訂單編號（human-readable）
 * @param {string} params.paymentMethod - 'bank_transfer' | 'line_pay'
 *
 * @returns {Promise<{ method: string, redirectUrl?: string, bankInfo?: object }>}
 */
export async function initiatePayment({ orderId, paymentMethod }) {
    if (paymentMethod === PAYMENT_METHODS.LINE_PAY) {
        const res = await fetch('/api/linepay/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.error || `LINE Pay 付款建立失敗（${res.status}）`);
        }
        return {
            method: PAYMENT_METHODS.LINE_PAY,
            redirectUrl: data.paymentUrl,
            transactionId: data.transactionId,
        };
    }

    return {
        method: PAYMENT_METHODS.BANK_TRANSFER,
        bankInfo: getBankTransferInfo(),
    };
}

/**
 * 確認 LINE Pay 付款（/store/payment/confirm 頁面呼叫）
 */
export async function confirmLinePayPayment({ orderId, transactionId }) {
    const res = await fetch('/api/linepay/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, transactionId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || `LINE Pay 付款確認失敗（${res.status}）`);
    }
    return data;
}

/**
 * LINE Pay 退款（Admin 後台使用，需帶 Supabase access token）
 */
export async function refundLinePay({ orderId, refundAmount, accessToken }) {
    const res = await fetch('/api/linepay/refund', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderId, refundAmount }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || `LINE Pay 退款失敗（${res.status}）`);
    }
    return data;
}

export function getPaymentStatusLabel(paymentStatus) {
    const labels = {
        pending: '待付款',
        paid: '已付款',
        failed: '付款失敗',
        refunded: '已退款',
        partial_refunded: '部分退款',
    };
    return labels[paymentStatus] ?? '未知';
}

export function getPaymentMethodLabel(method) {
    const labels = {
        bank_transfer: '銀行轉帳',
        line_pay: 'LINE Pay',
    };
    return labels[method] ?? method;
}
