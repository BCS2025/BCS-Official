import { getSupabaseAdmin } from '../_lib/linepay.js';

const receiptFormat = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { orderId, receipt } = req.body || {};
    if (typeof orderId !== 'string' || !/^ORD-\d{6}$/.test(orderId) || typeof receipt !== 'string' || !receiptFormat.test(receipt)) {
        return res.status(400).json({ error: '請從訂單完成頁查詢。' });
    }
    try {
        const { data, error } = await getSupabaseAdmin().from('orders').select('id')
            .eq('id', receipt).eq('order_id', orderId).eq('payment_method', 'bank_transfer')
            .eq('payment_status', 'pending').maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: '查無待轉帳訂單。' });
        const bank = process.env.PAYMENT_BANK_NAME || process.env.VITE_PAYMENT_BANK_NAME;
        const account = process.env.PAYMENT_ACCOUNT || process.env.VITE_PAYMENT_ACCOUNT;
        if (!bank?.trim() || !account?.trim()) throw new Error('Missing transfer configuration');
        return res.status(200).json({ bank: bank.trim(), account: account.trim() });
    } catch {
        return res.status(503).json({ error: '請稍後再試，或透過官方 LINE 取得匯款資訊。' });
    }
}

