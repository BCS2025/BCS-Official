import { callLinePay, getSupabaseAdmin, assertAdmin, notifyGASServer } from '../_lib/linepay.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let user;
    try {
        user = await assertAdmin(req);
    } catch (err) {
        return res.status(err.status || 401).json({ error: err.message || 'Unauthorized' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { orderId, refundAmount } = body || {};
    if (!orderId) return res.status(400).json({ error: '缺少 orderId' });

    try {
        const supabase = getSupabaseAdmin();
        const { data: order, error } = await supabase
            .from('orders')
            .select('order_id, total_amount, payment_method, payment_status, payment_ref, admin_notes, user_info')
            .eq('order_id', orderId)
            .maybeSingle();

        if (error) throw error;
        if (!order) return res.status(404).json({ error: '訂單不存在' });
        if (order.payment_method !== 'line_pay') {
            return res.status(400).json({ error: '非 LINE Pay 訂單不可由此退款' });
        }
        if (order.payment_status !== 'paid') {
            return res.status(400).json({ error: '訂單尚未付款或已退款' });
        }
        if (!order.payment_ref) {
            return res.status(400).json({ error: '訂單缺少 LINE Pay 交易編號，無法退款' });
        }

        const amount = Number.isFinite(Number(refundAmount)) && Number(refundAmount) > 0
            ? Math.round(Number(refundAmount))
            : null;
        if (amount !== null && amount > order.total_amount) {
            return res.status(400).json({ error: '退款金額不可超過訂單金額' });
        }

        const refundBody = amount ? { refundAmount: amount } : {};
        const { httpStatus, data } = await callLinePay({
            path: `/v3/payments/${encodeURIComponent(order.payment_ref)}/refund`,
            body: refundBody,
        });

        if (httpStatus !== 200 || data.returnCode !== '0000') {
            console.error('[linepay/refund] 失敗：', { httpStatus, data });
            return res.status(502).json({
                error: `LINE Pay 退款失敗：${data.returnMessage || 'unknown'}`,
                returnCode: data.returnCode,
            });
        }

        const refundedAmount = amount ?? order.total_amount;
        const isFull = refundedAmount >= order.total_amount;
        const noteLine = `🔁 ${new Date().toLocaleString('zh-TW')} 由 ${user.email} 執行 LINE Pay ${isFull ? '全額' : '部分'}退款 $${refundedAmount}（refundTransactionId=${data.info?.refundTransactionId || ''}）`;
        const nextNotes = order.admin_notes ? `${order.admin_notes}\n${noteLine}` : noteLine;

        const updates = {
            admin_notes: nextNotes,
            payment_status: isFull ? 'refunded' : 'partial_refunded',
        };
        if (isFull) {
            updates.status = 'cancelled';
            updates.cancelled_at = new Date().toISOString();
        }

        const { error: updErr } = await supabase
            .from('orders')
            .update(updates)
            .eq('order_id', orderId);

        if (updErr) console.error('[linepay/refund] DB 更新失敗：', updErr);

        notifyGASServer({
            type: 'payment_refunded',
            orderId: order.order_id,
            refundAmount: refundedAmount,
            isFull,
            refundedBy: user.email,
            refundTransactionId: data.info?.refundTransactionId || null,
            customer: order.user_info,
        }, 'payment_refund').catch(() => {});

        return res.status(200).json({
            ok: true,
            refundAmount: refundedAmount,
            isFull,
            refundTransactionId: data.info?.refundTransactionId || null,
        });
    } catch (err) {
        console.error('[linepay/refund] 例外：', err);
        return res.status(500).json({ error: err.message || 'LINE Pay 退款處理失敗' });
    }
}
