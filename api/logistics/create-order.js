import { assertAdmin, getSupabaseAdmin } from '../_lib/linepay.js';
import { createLogisticsOrder } from './_lib/create-order-core.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await assertAdmin(req);
    } catch (err) {
        return res.status(err.status || 401).json({ error: err.message || '未授權' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { orderId } = body || {};
    if (!orderId) return res.status(400).json({ error: '缺少 orderId' });

    try {
        const supabase = getSupabaseAdmin();
        const result = await createLogisticsOrder(supabase, orderId);
        return res.status(200).json(result);
    } catch (err) {
        console.error('[logistics/create-order] 失敗：', err);
        const ecpay = err.ecpay || null;
        return res.status(ecpay ? 502 : 500).json({
            error: err.message || '建立物流單失敗',
            ecpay,
        });
    }
}
