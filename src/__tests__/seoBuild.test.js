import { describe, expect, it, vi } from 'vitest';
import { canonicalUrl, isIndexablePath, publicRoutes, INDEXED_STATIC_ROUTES } from '../lib/seoPolicy';
import { sitemapXml, sitemapPlugin, fetchPublicRoutes, assertRenderedRoute } from '../../scripts/seo/build-seo.mjs';

function catalogueClient(tables, override = () => undefined) {
    const requests = [];
    return {
        requests,
        from(table) {
            let activeOnly = false;
            const query = {
                select() { return query; }, order() { return query; },
                eq(field, value) { activeOnly = field === 'is_active' && value === true; return query; },
                async range(from, to) {
                    requests.push({ table, from, to });
                    const rows = (tables[table] || []).filter(row => !activeOnly || row.is_active);
                    return override(table, from) || { data: rows.slice(from, to + 1), error: null, count: rows.length };
                },
            };
            return query;
        },
    };
}

const rendered = (route, { status = 'ready', canonical = canonicalUrl(route), noindex = !isIndexablePath(route), path = route } = {}) => ({
    route,
    html: `<html data-bcs-render-status="${status}" data-bcs-render-path="${path}"><head><link href="${canonical}" rel="canonical">${noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}</head><body>完整內容</body></html>`,
});

describe('public indexing policy', () => {
    it('canonical 使用 www 並排除查詢參數、fragment 與尾斜線', () => {
        expect(canonicalUrl('/store/products/?cat=materials#details')).toBe('https://www.bcs.tw/store/products');
        expect(canonicalUrl('/')).toBe('https://www.bcs.tw/');
    });
    it.each(['https://outside.invalid/page', '//outside.invalid', '/\\outside.invalid'])('拒絕站外路徑 %s', path => {
        expect(() => canonicalUrl(path)).toThrow();
    });
    it.each(['/store/cart', '/store/thank-you', '/store/payment/confirm', '/store/track', '/admin/orders', '/unknown'])('私人或未知路由不索引：%s', path => {
        expect(isIndexablePath(path)).toBe(false);
    });
    it('商品只取啟用列、路由去重，保留目前公開的歷史課程', () => {
        const routes = publicRoutes({ products: [{ id: 'a', is_active: true }, { id: 'a', is_active: true }, { id: 'b', is_active: false }], courses: [{ id: 'c', status: 'closed' }, { id: 'c', status: 'closed' }] });
        expect(routes).toHaveLength(INDEXED_STATIC_ROUTES.length + 2);
        expect(routes).toContain('/makerworld/c');
        expect(routes).not.toContain('/store/product/b');
    });
    it('商品 ID 的特殊字元只作路徑資料', () => {
        expect(publicRoutes({ products: [{ id: 'a & b', is_active: true }] })).toContain('/store/product/a%20%26%20b');
        expect(() => publicRoutes({ courses: [{ id: '..' }] })).toThrow();
    });
    it('sitemap 每個 canonical 只出現一次，不收錄購物車或偽造 lastmod', () => {
        const xml = sitemapXml(['/store/products', '/store/products/', '/store/products?cat=materials', '/store/cart', '/admin']);
        expect(xml.match(/<loc>/g)).toHaveLength(1);
        expect(xml).toContain('https://www.bcs.tw/store/products');
        expect(xml).not.toMatch(/cart|admin|lastmod/);
    });
    it('隔離環境不產生可索引網址', () => {
        const emitFile = vi.fn();
        sitemapPlugin(publicRoutes(), { isolated: true }).generateBundle.call({ emitFile });
        expect(emitFile.mock.calls[0][0].source).not.toContain('<loc>');
    });
});

describe('catalogue route queries', () => {
    it('跨頁取得所有商品與課程，以穩定 ID 順序分頁', async () => {
        const client = catalogueClient({ products: [1, 2, 3].map(id => ({ id: `p${id}`, is_active: true })), courses: [{ id: 'c' }] });
        const routes = await fetchPublicRoutes(client, { pageSize: 2 });
        expect(routes).toContain('/store/product/p3');
        expect(routes).toContain('/makerworld/c');
        expect(client.requests.filter(request => request.table === 'products')).toEqual([{ table: 'products', from: 0, to: 1 }, { table: 'products', from: 2, to: 3 }]);
    });
    it('查詢失敗不能靜默發布只剩靜態頁的 sitemap', async () => {
        const client = catalogueClient({}, () => ({ data: null, error: new Error('offline'), count: null }));
        await expect(fetchPublicRoutes(client)).rejects.toThrow('query failed');
    });
    it('資料在分頁間改變時中止，而不是發布不完整清單', async () => {
        const client = catalogueClient({ products: [{ id: 'p1', is_active: true }, { id: 'p2', is_active: true }] }, (table, from) => table === 'products' && from > 0 ? { data: [], error: null, count: 1 } : undefined);
        await expect(fetchPublicRoutes(client, { pageSize: 1 })).rejects.toThrow('changed');
    });
    it('資料回應缺失或提前終止時中止', async () => {
        await expect(fetchPublicRoutes(catalogueClient({}, () => ({ data: null, error: null, count: 0 })))).rejects.toThrow('Invalid');
        await expect(fetchPublicRoutes(catalogueClient({}, () => ({ data: [], error: null, count: 1 })))).rejects.toThrow('Incomplete');
    });
});

describe('prerender output gate', () => {
    it.each(['/', '/makerworld/c', '/store/cart'])('完整內容與索引政策符合時接受：%s', route => {
        const result = rendered(route);
        expect(assertRenderedRoute(result)).toBe(result);
    });
    it.each(['pending', 'error'])('不能把 %s 當作預渲染完成', status => {
        expect(() => assertRenderedRoute(rendered('/makerworld/c', { status }))).toThrow('not ready');
    });
    it('拒絕上一堂課的內容與錯誤 canonical', () => {
        expect(() => assertRenderedRoute(rendered('/makerworld/c', { path: '/makerworld/old' }))).toThrow('not ready');
        expect(() => assertRenderedRoute(rendered('/makerworld/c', { canonical: 'https://bcs.tw/makerworld/c' }))).toThrow('canonical');
    });
    it('購物車必須 noindex，公開頁不得誤設 noindex', () => {
        expect(() => assertRenderedRoute(rendered('/store/cart', { noindex: false }))).toThrow('indexing policy');
        expect(() => assertRenderedRoute(rendered('/store/products', { noindex: true }))).toThrow('indexing policy');
    });
});
