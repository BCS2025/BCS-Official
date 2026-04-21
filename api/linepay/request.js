import { callLinePay, getSupabaseAdmin, buildPackagesFromItems } from '../_lib/linepay.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { orderId } = body || {};
    if (!orderId) return res.status(400).json({ error: '缺少 orderId' });

    try {
        const supabase = getSupabaseAdmin();
        const { data: order, error } = await supabase
            .from('orders')
            .select('order_id, total_amount, items, user_info, payment_method, payment_status, source')
            .eq('order_id', orderId)
            .maybeSingle();

        if (error) throw error;
        if (!order) return res.status(404).json({ error: '訂單不存在' });
        if (order.payment_method !== 'line_pay') {
            return res.status(400).json({ error: '此訂單不是 LINE Pay 付款方式' });
        }
        if (order.payment_status === 'paid') {
            return res.status(409).json({ error: '訂單已付款，請勿重複付款' });
        }

        const siteUrl = process.env.VITE_SITE_URL || `https://${req.headers.host}`;
        const packages = buildPackagesFromItems(order.items, order.total_amount);

        const requestBody = {
            amount: order.total_amount,
            currency: 'TWD',
            orderId: order.order_id,
            packages,
            redirectUrls: {
                confirmUrl: `${siteUrl}/store/payment/confirm?orderId=${encodeURIComponent(order.order_id)}`,
                cancelUrl: `${siteUrl}/store/payment/cancel?orderId=${encodeURIComponent(order.order_id)}`,
            },
        };

        const { httpStatus, data } = await callLinePay({
            path: '/v3/payments/request',
            body: requestBody,
        });

        if (httpStatus !== 200 || data.returnCode !== '0000') {
            console.error('[linepay/request] 失敗：', { httpStatus, data });
            return res.status(502).json({
                error: `LINE Pay 拒絕請求：${data.returnMessage || 'unknown'}`,
                returnCode: data.returnCode,
            });
        }

        return res.status(200).json({
            paymentUrl: data.info.paymentUrl.web,
            appUrl: data.info.paymentUrl.app,
            transactionId: data.info.transactionId,
        });
    } catch (err) {
        console.error('[linepay/request] 例外：', err);
        return res.status(500).json({ error: err.message || '建立 LINE Pay 付款請求失敗' });
    }
}
