import { postLogistics } from './ecpay-client.js';

const C2C_SUBTYPES = new Set(['UNIMARTC2C', 'FAMIC2C', 'HILIFEC2C', 'OKMARTC2C']);
const HOME_SUBTYPES = new Set(['TCAT', 'POST']);

function getSenderInfo() {
    return {
        name: process.env.ECPAY_LOGISTICS_SENDER_NAME || '比創空間',
        cellPhone: process.env.ECPAY_LOGISTICS_SENDER_CELLPHONE || '',
        phone: process.env.ECPAY_LOGISTICS_SENDER_PHONE || '',
        zip: process.env.ECPAY_LOGISTICS_SENDER_ZIP || '710',
        address: process.env.ECPAY_LOGISTICS_SENDER_ADDRESS || '臺南市永康區六合里新興街34巷2之2號',
    };
}

function tradeDateNow() {
    const d = new Date(Date.now() + 8 * 3600 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function buildGoodsName(items) {
    if (!Array.isArray(items) || !items.length) return '比創空間商品';
    const first = items[0]?.productName || items[0]?.productId || '商品';
    const extra = items.length > 1 ? `等${items.length}件` : '';
    const full = String(first) + extra;
    return full.slice(0, 50);
}

function shortMerchantTradeNo(orderId) {
    const stripped = String(orderId).replace(/[^A-Za-z0-9]/g, '').slice(-13);
    const prefix = `LG${Date.now().toString().slice(-5)}`;
    return (prefix + stripped).slice(0, 20);
}

function pickSubType(order) {
    return order.logistics_sub_type || order.cvs_store_brand || '';
}

function validateOrder(order) {
    const subType = pickSubType(order);
    if (!subType) throw new Error('訂單未選擇物流方式（缺少 logistics_sub_type）');

    const userInfo = order.user_info || {};
    const receiverName = userInfo.name || userInfo.customerName;
    const receiverCell = userInfo.cellPhone || userInfo.phone;
    if (!receiverName) throw new Error('訂單缺少收件人姓名');
    if (!receiverCell || !/^09\d{8}$/.test(String(receiverCell))) {
        throw new Error('收件人手機需為 09 開頭 10 碼');
    }

    if (C2C_SUBTYPES.has(subType)) {
        if (!order.cvs_store_id) throw new Error('訂單未選擇取貨門市（缺少 cvs_store_id）');
    } else if (HOME_SUBTYPES.has(subType)) {
        if (!userInfo.zipCode) throw new Error('宅配訂單缺少收件人郵遞區號');
        if (!userInfo.address) throw new Error('宅配訂單缺少收件人地址');
    } else {
        throw new Error(`不支援的物流子類型：${subType}`);
    }

    return { subType, receiverName, receiverCell };
}

function buildC2CPayload(order, subType, receiverName, receiverCell, sender, serverReplyUrl) {
    const goodsAmount = Math.max(1, Math.min(20000, Number(order.total_amount) || 0));
    const payload = {
        MerchantTradeNo: shortMerchantTradeNo(order.order_id),
        MerchantTradeDate: tradeDateNow(),
        LogisticsType: 'CVS',
        LogisticsSubType: subType,
        GoodsAmount: goodsAmount,
        GoodsName: buildGoodsName(order.items),
        SenderName: sender.name,
        SenderCellPhone: sender.cellPhone,
        ReceiverName: receiverName,
        ReceiverCellPhone: receiverCell,
        ReceiverStoreID: order.cvs_store_id,
        ServerReplyURL: serverReplyUrl,
        IsCollection: 'N',
    };
    if (subType === 'UNIMARTC2C') {
        payload.CollectionAmount = goodsAmount;
    }
    return payload;
}

function buildHomePayload(order, subType, receiverName, receiverCell, sender, serverReplyUrl) {
    const userInfo = order.user_info || {};
    const goodsAmount = Math.max(1, Number(order.total_amount) || 0);
    const payload = {
        MerchantTradeNo: shortMerchantTradeNo(order.order_id),
        MerchantTradeDate: tradeDateNow(),
        LogisticsType: 'HOME',
        LogisticsSubType: subType,
        GoodsAmount: goodsAmount,
        GoodsName: buildGoodsName(order.items),
        SenderName: sender.name,
        SenderCellPhone: sender.cellPhone,
        SenderZipCode: sender.zip,
        SenderAddress: sender.address,
        ReceiverName: receiverName,
        ReceiverCellPhone: receiverCell,
        ReceiverZipCode: String(userInfo.zipCode || '').slice(0, 5),
        ReceiverAddress: String(userInfo.address || '').slice(0, 60),
        ServerReplyURL: serverReplyUrl,
        Temperature: '0001',
        Distance: '00',
        Specification: '0001',
        ScheduledPickupTime: '4',
    };
    if (subType === 'POST') {
        payload.GoodsWeight = Number(process.env.ECPAY_LOGISTICS_DEFAULT_WEIGHT_KG || 1);
        delete payload.Temperature;
        delete payload.Distance;
        delete payload.Specification;
        delete payload.ScheduledPickupTime;
    } else {
        payload.ScheduledDeliveryTime = '4';
    }
    return payload;
}

export async function createLogisticsOrder(supabase, orderId, serverReplyUrl) {
    if (!serverReplyUrl) {
        throw new Error('createLogisticsOrder 缺少 serverReplyUrl 參數');
    }
    const { data: order, error } = await supabase
        .from('orders')
        .select('id, order_id, user_info, items, total_amount, logistics_id, logistics_sub_type, cvs_store_id, cvs_store_brand')
        .eq('order_id', orderId)
        .maybeSingle();
    if (error) throw error;
    if (!order) throw new Error(`訂單 ${orderId} 不存在`);
    if (order.logistics_id) {
        return { ok: true, alreadyCreated: true, logisticsId: order.logistics_id };
    }

    const { subType, receiverName, receiverCell } = validateOrder(order);
    const sender = getSenderInfo();

    const params = C2C_SUBTYPES.has(subType)
        ? buildC2CPayload(order, subType, receiverName, receiverCell, sender, serverReplyUrl)
        : buildHomePayload(order, subType, receiverName, receiverCell, sender, serverReplyUrl);

    const result = await postLogistics('/Express/Create', params);
    const fields = result.parsed.fields || {};
    const rtnCode = fields.RtnCode || result.parsed.rtnCode;

    if (String(rtnCode) !== '1') {
        const msg = fields.RtnMsg || result.parsed.rtnMsg || '建立物流單失敗';
        const err = new Error(`綠界回應 RtnCode=${rtnCode}：${msg}`);
        err.ecpay = { rtnCode, rtnMsg: msg, raw: result.raw };
        throw err;
    }

    const update = {
        logistics_id: fields.AllPayLogisticsID || null,
        logistics_sub_type: subType,
        logistics_status: rtnCode,
        logistics_status_at: new Date().toISOString(),
        logistics_message: fields.RtnMsg || '建單成功',
        shipment_no: fields.BookingNote || fields.CVSPaymentNo || null,
        payment_no: fields.CVSPaymentNo || null,
    };

    const { error: updateErr } = await supabase
        .from('orders')
        .update(update)
        .eq('order_id', orderId);
    if (updateErr) throw updateErr;

    return {
        ok: true,
        alreadyCreated: false,
        logisticsId: update.logistics_id,
        paymentNo: update.payment_no,
        shipmentNo: update.shipment_no,
        ecpay: { rtnCode, rtnMsg: update.logistics_message, fields },
    };
}

/**
 * 包裝 createLogisticsOrder：付款成功後立即叫單，失敗不丟例外，
 * 改寫入 notification_failures，由後台 AdminOrders 補建。
 *
 * 跳過情境：
 *  - 自取（無 logistics_sub_type 也無 cvs_store_brand）
 *  - 已建單（createLogisticsOrder 內 alreadyCreated 直接回 true）
 */
export async function tryAutoCreateLogistics(supabase, orderId, serverReplyUrl) {
    try {
        const { data: order, error } = await supabase
            .from('orders')
            .select('order_id, logistics_id, logistics_sub_type, cvs_store_brand')
            .eq('order_id', orderId)
            .maybeSingle();
        if (error) throw error;
        if (!order) return { ok: false, reason: 'order_not_found' };
        if (order.logistics_id) return { ok: true, alreadyCreated: true, logisticsId: order.logistics_id };

        const subType = order.logistics_sub_type || order.cvs_store_brand;
        if (!subType) return { ok: true, skipped: 'self_pickup_or_no_logistics' };

        const result = await createLogisticsOrder(supabase, orderId, serverReplyUrl);
        return result;
    } catch (err) {
        console.error('[logistics/auto-create] 失敗：', err.message, err.ecpay || '');
        try {
            await supabase.from('notification_failures').insert([{
                context: 'logistics_create_failed',
                payload: {
                    orderId,
                    error: err.message,
                    ecpay: err.ecpay || null,
                    at: new Date().toISOString(),
                },
                failed_at: new Date().toISOString(),
            }]);
        } catch (dbErr) {
            console.error('[logistics/auto-create] notification_failures 寫入也失敗：', dbErr.message);
        }
        return { ok: false, error: err.message, ecpay: err.ecpay || null };
    }
}
