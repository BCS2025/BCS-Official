import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export function getLinePayEnv() {
    const channelId = process.env.LINE_PAY_CHANNEL_ID;
    const channelSecret = process.env.LINE_PAY_CHANNEL_SECRET;
    const apiBase = process.env.LINE_PAY_API_BASE || 'https://sandbox-api-pay.line.me';
    const merchantDeviceProfileId = process.env.LINE_PAY_MERCHANT_DEVICE_PROFILE_ID || null;
    if (!channelId || !channelSecret) {
        throw new Error('LINE Pay 環境變數未設定（需要 LINE_PAY_CHANNEL_ID / LINE_PAY_CHANNEL_SECRET）');
    }
    return { channelId, channelSecret, apiBase, merchantDeviceProfileId };
}

export function getSupabaseAdmin() {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    // 不再 fallback 成 anon key：若沒設 service_role key，寧可明確報錯，
    // 也不要默默用 anon 權限跑後端（RLS 開啟後 anon 會讀不到 orders）。
    if (!url || !key) {
        throw new Error('Supabase 後端環境變數未設定（需要 VITE_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY）');
    }
    return createClient(url, key, { auth: { persistSession: false } });
}

function sign({ channelSecret, path, body, nonce }) {
    const message = channelSecret + path + JSON.stringify(body) + nonce;
    return crypto.createHmac('sha256', channelSecret).update(message).digest('base64');
}

export async function callLinePay({ path, body }) {
    const { channelId, channelSecret, apiBase, merchantDeviceProfileId } = getLinePayEnv();
    const nonce = crypto.randomUUID();
    const signature = sign({ channelSecret, path, body, nonce });

    const headers = {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': channelId,
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature,
    };
    if (merchantDeviceProfileId) headers['X-LINE-MerchantDeviceProfileId'] = merchantDeviceProfileId;

    const res = await fetch(`${apiBase}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    let data = {};
    try { data = await res.json(); } catch { /* non-JSON response */ }
    return { httpStatus: res.status, data };
}

export async function assertAdmin(req) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) throw { status: 401, message: '缺少授權 Token' };
    const token = authHeader.slice(7);

    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw { status: 500, message: '伺服器未設定 Supabase 環境變數' };

    const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data?.user) throw { status: 401, message: '登入狀態無效，請重新登入' };

    // 第二道鎖：除了「是有效登入者」外，再確認是「管理員 Email」。
    // 即使未來不慎開啟公開註冊，非白名單帳號也無法呼叫後台 API。
    // 預設白名單可由 Vercel 環境變數 ADMIN_EMAILS（逗號分隔）覆寫。
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@bcs.tw,stella@bcs.tw')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
    const userEmail = (data.user.email || '').toLowerCase();
    if (!ADMIN_EMAILS.includes(userEmail)) {
        throw { status: 403, message: '此帳號無管理員權限' };
    }

    return data.user;
}

export async function notifyGASServer(payload, context) {
    const url = process.env.VITE_GAS_WEBHOOK_URL;
    if (!url) {
        console.warn('[linepay] VITE_GAS_WEBHOOK_URL 未設定，略過通知', { context });
        return { ok: false, reason: 'no_webhook_url' };
    }
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return { ok: res.ok, status: res.status };
    } catch (err) {
        console.error(`[linepay] GAS 通知失敗（${context}）：`, err.message);
        try {
            const supabase = getSupabaseAdmin();
            await supabase.from('notification_failures').insert([{
                context,
                payload,
                failed_at: new Date().toISOString(),
            }]);
        } catch (dbErr) {
            console.error('[linepay] notification_failures 寫入也失敗：', dbErr.message);
        }
        return { ok: false, error: err.message };
    }
}

export function buildPackagesFromItems(items, totalAmount) {
    const products = (items || []).map((item, idx) => {
        const name = item.productName || item.productId || `商品${idx + 1}`;
        const quantity = Number(item.quantity) || 1;
        const lineTotal = Number(item.price) || 0;
        const unitPrice = Math.round(lineTotal / quantity);
        return {
            id: String(item.productId || `p${idx}`),
            name: String(name).slice(0, 100),
            quantity,
            price: unitPrice,
        };
    });

    const productsTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const packageAmount = Math.max(productsTotal, 0);
    const shippingDelta = totalAmount - packageAmount;

    return [{
        id: 'bcs-pkg-1',
        amount: packageAmount + Math.max(0, shippingDelta),
        name: '比創空間・販創所',
        products: shippingDelta > 0
            ? [...products, { id: 'shipping', name: '運費', quantity: 1, price: shippingDelta }]
            : products,
    }];
}
