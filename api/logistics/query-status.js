import { getSupabaseAdmin } from '../_lib/linepay.js';
import { postLogistics } from './_lib/ecpay-client.js';

// refresh 節流：同一訂單在此秒數內重複 refresh，直接回 cache，不再呼叫綠界。
// 設為 25s 與前端 30s polling 對齊（略小以容許時間誤差）。
const THROTTLE_SECONDS = 25;

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

        // 節流：同一訂單在 THROTTLE_SECONDS 內重複 refresh，直接回 cache，不再打綠界。
        // logistics_checked_at 欄位若尚未建立（migration 未跑），此查詢會回 error → chk 為 null → 視為未節流。
        const { data: chk } = await supabase
            .from('orders')
            .select('logistics_checked_at')
            .eq('order_id', orderId)
            .maybeSingle();
        const lastCheckedMs = chk?.logistics_checked_at ? new Date(chk.logistics_checked_at).getTime() : 0;
        if (lastCheckedMs && (Date.now() - lastCheckedMs) < THROTTLE_SECONDS * 1000) {
            return res.status(200).json({ ok: true, hasLogisticsOrder: true, order, source: 'cache', throttled: true });
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

        // 記錄本次成功查詢綠界的時間（節流用）。與狀態更新分開寫入，
        // 即使 logistics_checked_at 欄位尚未建立而失敗，也不影響上面的狀態更新與本次回傳。
        await supabase
            .from('orders')
            .update({ logistics_checked_at: new Date().toISOString() })
            .eq('order_id', orderId);

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
