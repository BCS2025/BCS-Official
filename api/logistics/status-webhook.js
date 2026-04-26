import { getSupabaseAdmin, notifyGASServer } from '../_lib/linepay.js';
import { verifyCheckMacValue, getLogisticsEnv } from './_lib/check-mac.js';

function plainOk(res) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send('1|OK');
}

function plainErr(res, msg) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(400).send(`0|${msg}`);
}

function parseFormBody(req) {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') {
        const out = {};
        for (const [k, v] of new URLSearchParams(req.body)) out[k] = v;
        return out;
    }
    return {};
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).send('Method not allowed');
    }

    const params = parseFormBody(req);
    const logisticsId = params.AllPayLogisticsID;
    const rtnCode = params.RtnCode;
    const rtnMsg = params.RtnMsg || '';

    if (!logisticsId) return plainErr(res, 'missing AllPayLogisticsID');

    let env;
    try {
        env = getLogisticsEnv();
    } catch (err) {
        console.error('[logistics/status-webhook] env 缺失：', err.message);
        return plainErr(res, 'server config error');
    }

    if (!verifyCheckMacValue(params, env.hashKey, env.hashIv, 'md5')) {
        console.error('[logistics/status-webhook] CheckMacValue 驗證失敗', { logisticsId, rtnCode });
        return plainErr(res, 'invalid CheckMacValue');
    }

    try {
        const supabase = getSupabaseAdmin();
        const { data: order, error: lookupErr } = await supabase
            .from('orders')
            .select('order_id, logistics_status, user_info, cvs_store_name, cvs_store_address, logistics_sub_type, shipment_no, payment_no')
            .eq('logistics_id', logisticsId)
            .maybeSingle();
        if (lookupErr) throw lookupErr;
        if (!order) {
            console.warn('[logistics/status-webhook] 找不到對應訂單，仍回 1|OK 以停止重送', { logisticsId });
            return plainOk(res);
        }

        if (String(order.logistics_status) !== String(rtnCode)) {
            const { error: updateErr } = await supabase
                .from('orders')
                .update({
                    logistics_status: String(rtnCode),
                    logistics_status_at: new Date().toISOString(),
                    logistics_message: rtnMsg,
                })
                .eq('logistics_id', logisticsId);
            if (updateErr) console.error('[logistics/status-webhook] update 失敗：', updateErr);

            await notifyGASServer({
                type: 'logistics_status',
                source: 'store',
                orderId: order.order_id,
                logisticsId,
                subType: order.logistics_sub_type || null,
                shipmentNo: order.shipment_no || null,
                paymentNo: order.payment_no || null,
                rtnCode: String(rtnCode),
                rtnMsg,
                storeName: order.cvs_store_name || null,
                storeAddress: order.cvs_store_address || null,
                customer: {
                    name: order.user_info?.name || null,
                    phone: order.user_info?.cellPhone || order.user_info?.phone || null,
                    email: order.user_info?.email || null,
                },
                ts: new Date().toISOString(),
            }, 'logistics_status').catch((e) => {
                console.error('[logistics/status-webhook] GAS 轉發例外：', e.message);
            });
        }

        return plainOk(res);
    } catch (err) {
        console.error('[logistics/status-webhook] 處理例外：', err);
        return plainOk(res);
    }
}
