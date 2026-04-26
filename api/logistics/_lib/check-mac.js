import crypto from 'node:crypto';

const NET_REPLACEMENTS = {
    '%2d': '-',
    '%5f': '_',
    '%2e': '.',
    '%21': '!',
    '%2a': '*',
    '%28': '(',
    '%29': ')',
};

export function ecpayUrlEncode(source) {
    let encoded = encodeURIComponent(source)
        .replace(/%20/g, '+')
        .replace(/~/g, '%7e')
        .replace(/'/g, '%27');
    encoded = encoded.toLowerCase();
    for (const [from, to] of Object.entries(NET_REPLACEMENTS)) {
        encoded = encoded.split(from).join(to);
    }
    return encoded;
}

export function generateCheckMacValue(params, hashKey, hashIv, method = 'md5') {
    const filtered = Object.entries(params)
        .filter(([k, v]) => k !== 'CheckMacValue' && v !== undefined && v !== null);

    filtered.sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));

    const paramStr = filtered.map(([k, v]) => `${k}=${v}`).join('&');
    const raw = `HashKey=${hashKey}&${paramStr}&HashIV=${hashIv}`;
    const encoded = ecpayUrlEncode(raw);
    const hash = crypto.createHash(method).update(encoded, 'utf8').digest('hex');
    return hash.toUpperCase();
}

export function verifyCheckMacValue(params, hashKey, hashIv, method = 'md5') {
    const received = String(params.CheckMacValue || '');
    const calculated = generateCheckMacValue(params, hashKey, hashIv, method);
    if (received.length !== calculated.length) return false;
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(calculated));
}

export function getLogisticsEnv() {
    const merchantId = process.env.ECPAY_LOGISTICS_MERCHANT_ID;
    const hashKey = process.env.ECPAY_LOGISTICS_HASH_KEY;
    const hashIv = process.env.ECPAY_LOGISTICS_HASH_IV;
    const baseUrl = process.env.ECPAY_LOGISTICS_BASE_URL || 'https://logistics-stage.ecpay.com.tw';
    if (!merchantId || !hashKey || !hashIv) {
        throw new Error('綠界物流環境變數未設定（需要 ECPAY_LOGISTICS_MERCHANT_ID / HASH_KEY / HASH_IV）');
    }
    return { merchantId, hashKey, hashIv, baseUrl };
}
