import { getSupabaseAdmin } from '../_lib/linepay.js';
import { postLogistics } from './_lib/ecpay-client.js';

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const params = req.method === 'GET' ? (req.query || {}) : (typeof req.body === 'string' ? safeJson(req.body) : (req.body || {}));
    const orderId = params.orderId;
    const refresh = String(params.refresh || '').toLowerCase() === 'true';

    if (!orderId) return res.status(400).json({ error: '缺少 orderId' });

    try {
        const supabase = getSupabaseAdmin();
        const { data: order, error } = await supabase
            .from('orders')
            .select('order_id, logistics_id, logistics_sub_type, logistics_status, logistics_status_at, logistics_message, shipment_no, payment_no, cvs_store_name, cvs_store_brand, cvs_store_address')
            .eq('order_id', orderId)
            .maybeSingle();
        if (error) throw error;
        if (!order) return res.status(404).json({ error: '訂單不存在' });

        if (!order.logistics_id) {
            return res.status(200).json({
                ok: true,
                hasLogisticsOrder: false,
                order,
            });
        }

        if (!refresh) {
            return res.status(200).json({ ok: true, hasLogisticsOrder: true, order, source: 'cache' });
        }

        const result = await postLogistics('/Helper/QueryLogisticsTradeInfo/V5', {
            AllPayLogisticsID: order.logistics_id,
            TimeStamp: Math.floor(Date.now() / 1000),
        });
        const fields = result.parsed.fields || {};
        const newStatus = fields.LogisticsStatus || fields.RtnCode || order.logistics_status;
        const newMsg = fields.LogisticsStatusMsg || fields.RtnMsg || order.logistics_message;

        if (newStatus && String(newStatus) !== String(order.logistics_status)) {
            const { error: updateErr } = await supabase
                .from('orders')
                .update({
                    logistics_status: String(newStatus),
                    logistics_status_at: new Date().toISOString(),
                    logistics_message: newMsg,
                })
                .eq('order_id', orderId);
            if (updateErr) console.error('[logistics/query-status] update 失敗：', updateErr);
            order.logistics_status = String(newStatus);
            order.logistics_status_at = new Date().toISOString();
            order.logistics_message = newMsg;
        }

        return res.status(200).json({
            ok: true,
            hasLogisticsOrder: true,
            order,
            ecpay: { rtnCode: result.parsed.rtnCode, fields },
            source: 'fresh',
        });
    } catch (err) {
        console.error('[logistics/query-status] 例外：', err);
        return res.status(500).json({ error: err.message || '查詢物流狀態失敗' });
    }
}

function safeJson(s) {
    try { return JSON.parse(s); } catch { return {}; }
}
