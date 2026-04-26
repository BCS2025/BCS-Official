import { generateCheckMacValue, getLogisticsEnv } from './check-mac.js';

export function buildPayload(params) {
    const { merchantId, hashKey, hashIv } = getLogisticsEnv();
    const enriched = { MerchantID: merchantId, ...params };
    const checkMac = generateCheckMacValue(enriched, hashKey, hashIv, 'md5');
    return { ...enriched, CheckMacValue: checkMac };
}

export function buildAutoSubmitForm(actionUrl, payload, { title = 'Redirecting to ECPay...' } = {}) {
    const inputs = Object.entries(payload)
        .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(String(v ?? ''))}">`)
        .join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body onload="document.forms[0].submit()">
<form method="POST" action="${escapeHtml(actionUrl)}">${inputs}
<noscript><button type="submit">Continue</button></noscript>
</form></body></html>`;
}

export async function postLogistics(path, params) {
    const { baseUrl } = getLogisticsEnv();
    const payload = buildPayload(params);
    const body = new URLSearchParams(payload).toString();
    const url = `${baseUrl}${path}`;

    let res;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });
    } catch (err) {
        console.error('[ecpay-logistics] fetch failed:', { url, message: err.message });
        throw new Error(`綠界物流 API 連線失敗：${err.message}`);
    }

    const text = await res.text();
    if (!res.ok) {
        console.error('[ecpay-logistics] non-2xx:', { url, status: res.status, body: text.slice(0, 500) });
        throw new Error(`綠界物流 API HTTP ${res.status}：${text.slice(0, 200)}`);
    }
    return { httpStatus: res.status, raw: text, parsed: parseEcpayResponse(text) };
}

export function parseEcpayResponse(text) {
    if (!text) return { rtnCode: null, rtnMsg: '', fields: {} };
    const trimmed = text.trim();

    if (trimmed.includes('|') && !trimmed.includes('=')) {
        const [rtnCode, rtnMsg = ''] = trimmed.split('|');
        return { rtnCode, rtnMsg, fields: {} };
    }

    if (trimmed.includes('|') && trimmed.includes('=')) {
        const lines = trimmed.split(/\r?\n/);
        const head = lines[0];
        if (head.includes('|') && !head.includes('=')) {
            const [rtnCode, rtnMsg = ''] = head.split('|');
            const body = lines.slice(1).join('&');
            return { rtnCode, rtnMsg, fields: parseUrlEncoded(body) };
        }
        const pipeIdx = trimmed.indexOf('|');
        const eqIdx = trimmed.indexOf('=');
        if (pipeIdx < eqIdx) {
            const rtnCode = trimmed.slice(0, pipeIdx);
            const body = trimmed.slice(pipeIdx + 1);
            return { rtnCode, rtnMsg: '', fields: parseUrlEncoded(body) };
        }
    }

    const fields = parseUrlEncoded(trimmed);
    return { rtnCode: fields.RtnCode ?? null, rtnMsg: fields.RtnMsg ?? '', fields };
}

function parseUrlEncoded(body) {
    const result = {};
    for (const [k, v] of new URLSearchParams(body)) result[k] = v;
    return result;
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
