import { deriveBaseUrl } from './_lib/url-helpers.js';

function parseFormBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
        const out = {};
        for (const [k, v] of new URLSearchParams(req.body)) out[k] = v;
        return out;
    }
    return {};
}

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).send('Method not allowed');
    }

    const body = req.method === 'POST' ? parseFormBody(req) : (req.query || {});

    const storeId = body.CVSStoreID || '';
    const storeName = body.CVSStoreName || '';
    const storeAddress = body.CVSAddress || '';
    const storeBrand = body.LogisticsSubType || '';
    const extraData = body.ExtraData || '';

    const siteUrl = process.env.VITE_SITE_URL || deriveBaseUrl(req);
    const target = new URL('/store/cart', siteUrl);
    if (storeId) target.searchParams.set('cvs_store_id', storeId);
    if (storeName) target.searchParams.set('cvs_store_name', storeName);
    if (storeAddress) target.searchParams.set('cvs_store_address', storeAddress);
    if (storeBrand) target.searchParams.set('cvs_store_brand', storeBrand);
    if (extraData) target.searchParams.set('extra', extraData);

    res.setHeader('Location', target.toString());
    res.setHeader('Cache-Control', 'no-store');
    return res.status(302).end();
}
