import { callLinePay, getSupabaseAdmin, notifyGASServer } from '../_lib/linepay.js';
import { tryAutoCreateLogistics } from '../logistics/_lib/create-order-core.js';
import { getStatusWebhookUrl } from '../logistics/_lib/url-helpers.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { orderId, transactionId } = body || {};
    if (!orderId || !transactionId) {
        return res.status(400).json({ error: '缺少 orderId 或 transactionId' });
    }

    try {
        const supabase = getSupabaseAdmin();
        const { data: order, error } = await supabase
            .from('orders')
            .select('order_id, total_amount, items, user_info, payment_method, payment_status, payment_ref')
            .eq('order_id', orderId)
            .maybeSingle();

        if (error) throw error;
        if (!order) return res.status(404).json({ error: '訂單不存在' });
        if (order.payment_method !== 'line_pay') {
            return res.status(400).json({ error: '此訂單不是 LINE Pay 付款方式' });
        }

        if (order.payment_status === 'paid') {
            return res.status(200).json({
                success: true,
                orderId: order.order_id,
                alreadyPaid: true,
                totalAmount: order.total_amount,
            });
        }

        const { httpStatus, data } = await callLinePay({
            path: `/v3/payments/${encodeURIComponent(transactionId)}/confirm`,
            body: {
                amount: order.total_amount,
                currency: 'TWD',
            },
        });

        if (httpStatus !== 200 || data.returnCode !== '0000') {
            console.error('[linepay/confirm] 失敗：', { httpStatus, data });
            await supabase
                .from('orders')
                .update({
                    payment_status: 'failed',
                    payment_ref: String(transactionId),
                })
                .eq('order_id', orderId)
                .eq('payment_status', 'pending');

            return res.status(502).json({
                error: `LINE Pay 付款確認失敗：${data.returnMessage || 'unknown'}`,
                returnCode: data.returnCode,
            });
        }

        const paidAt = new Date().toISOString();
        const { error: updErr } = await supabase
            .from('orders')
            .update({
                status: 'paid',
                payment_status: 'paid',
                payment_ref: String(transactionId),
                paid_at: paidAt,
            })
            .eq('order_id', orderId)
            .eq('payment_status', 'pending');

        if (updErr) {
            console.error('[linepay/confirm] DB 更新失敗：', updErr);
        }

        try {
            await notifyGASServer({
                type: 'payment_confirmed',
                orderId: order.order_id,
                totalAmount: order.total_amount,
                paymentMethod: 'line_pay',
                transactionId: String(transactionId),
                paidAt,
                customer: order.user_info,
                items: order.items,
            }, 'payment_confirm');
        } catch (notifyErr) {
            console.error('[linepay/confirm] 通知失敗（不影響付款結果）：', notifyErr);
        }

        // 付款成功 → 自動建立綠界物流單；失敗只寫 notification_failures，不影響付款結果
        const logisticsResult = await tryAutoCreateLogistics(supabase, order.order_id, getStatusWebhookUrl(req));
        if (logisticsResult.ok && logisticsResult.logisticsId) {
            console.log('[linepay/confirm] 物流單已建立：', logisticsResult.logisticsId);
        } else if (logisticsResult.skipped) {
            console.log('[linepay/confirm] 跳過物流建單：', logisticsResult.skipped);
        } else if (!logisticsResult.ok) {
            console.warn('[linepay/confirm] 物流建單失敗，已寫入 notification_failures：', logisticsResult.error);
        }

        return res.status(200).json({
            success: true,
            orderId: order.order_id,
            transactionId: String(transactionId),
            totalAmount: order.total_amount,
            logistics: logisticsResult,
        });
    } catch (err) {
        console.error('[linepay/confirm] 例外：', err);
        return res.status(500).json({ error: err.message || 'LINE Pay 付款確認處理失敗' });
    }
}
