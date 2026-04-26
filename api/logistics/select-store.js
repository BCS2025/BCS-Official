import { buildAutoSubmitForm, buildPayload } from './_lib/ecpay-client.js';
import { getLogisticsEnv } from './_lib/check-mac.js';
import { getReplyUrl } from './_lib/url-helpers.js';

const VALID_SUBTYPES = new Set(['UNIMARTC2C', 'FAMIC2C', 'HILIFEC2C', 'OKMARTC2C']);

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).send('Method not allowed');
    }

    const params = req.method === 'GET' ? (req.query || {}) : (req.body || {});
    const subType = String(params.subType || params.LogisticsSubType || 'UNIMARTC2C').toUpperCase();
    const isCollection = String(params.isCollection || 'N').toUpperCase() === 'Y' ? 'Y' : 'N';
    const merchantTradeNo = String(params.merchantTradeNo || `MAP${Date.now().toString().slice(-13)}`);

    if (!VALID_SUBTYPES.has(subType)) {
        return res.status(400).send(`不支援的 LogisticsSubType：${subType}（僅支援 C2C 賣貨便：UNIMARTC2C / FAMIC2C / HILIFEC2C / OKMARTC2C）`);
    }

    let env;
    try {
        env = getLogisticsEnv();
    } catch (err) {
        console.error('[logistics/select-store] env 缺失:', err.message);
        return res.status(500).send('伺服器設定錯誤');
    }

    const replyUrl = getReplyUrl(req);

    let payload;
    try {
        payload = buildPayload({
            MerchantTradeNo: merchantTradeNo,
            LogisticsType: 'CVS',
            LogisticsSubType: subType,
            IsCollection: isCollection,
            ServerReplyURL: replyUrl,
        });
    } catch (err) {
        console.error('[logistics/select-store] buildPayload 失敗:', err);
        return res.status(500).send('產生選店表單失敗');
    }

    const html = buildAutoSubmitForm(`${env.baseUrl}/Express/map`, payload, {
        title: '前往綠界選擇超商門市…',
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(html);
}
