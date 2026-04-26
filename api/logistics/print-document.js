import { assertAdmin, getSupabaseAdmin } from '../_lib/linepay.js';
import { buildAutoSubmitForm, buildPayload } from './_lib/ecpay-client.js';
import { getLogisticsEnv } from './_lib/check-mac.js';

const C2C_PRINT_PATH = {
    UNIMARTC2C: '/Express/PrintUniMartC2COrderInfo',
    FAMIC2C: '/Express/PrintFAMIC2COrderInfo',
    HILIFEC2C: '/Express/PrintHILIFEC2COrderInfo',
    OKMARTC2C: '/Express/PrintOKMARTC2COrderInfo',
};

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).send('Method not allowed');
    }

    try {
        await assertAdmin(req);
    } catch (err) {
        return res.status(err.status || 401).send(err.message || '未授權');
    }

    const params = req.method === 'GET' ? (req.query || {}) : (typeof req.body === 'string' ? safeJson(req.body) : (req.body || {}));
    const { orderId } = params;
    if (!orderId) return res.status(400).send('缺少 orderId');

    try {
        const supabase = getSupabaseAdmin();
        const { data: order, error } = await supabase
            .from('orders')
            .select('order_id, logistics_id, logistics_sub_type, payment_no')
            .eq('order_id', orderId)
            .maybeSingle();
        if (error) throw error;
        if (!order) return res.status(404).send('訂單不存在');
        if (!order.logistics_id) return res.status(409).send('此訂單尚未建立物流單');

        const subType = order.logistics_sub_type;
        const env = getLogisticsEnv();
        let actionUrl;
        let payload;

        if (C2C_PRINT_PATH[subType]) {
            if (!order.payment_no) {
                return res.status(409).send('C2C 賣貨便缺少 CVSPaymentNo，無法列印（請檢查建單回應）');
            }
            actionUrl = `${env.baseUrl}${C2C_PRINT_PATH[subType]}`;
            payload = buildPayload({
                AllPayLogisticsID: order.logistics_id,
                CVSPaymentNo: order.payment_no,
            });
        } else if (subType === 'TCAT' || subType === 'POST' || ['UNIMART', 'FAMI', 'HILIFE'].includes(subType)) {
            actionUrl = `${env.baseUrl}/helper/printTradeDocument`;
            payload = buildPayload({
                AllPayLogisticsIDs: order.logistics_id,
            });
        } else {
            return res.status(400).send(`不支援的物流類型：${subType}`);
        }

        const html = buildAutoSubmitForm(actionUrl, payload, { title: '列印託運單…' });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(html);
    } catch (err) {
        console.error('[logistics/print-document] 例外：', err);
        return res.status(500).send(err.message || '列印失敗');
    }
}

function safeJson(s) {
    try { return JSON.parse(s); } catch { return {}; }
}
