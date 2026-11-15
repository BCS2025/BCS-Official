import { canonicalUrl, isIndexablePath, publicRoutes } from '../../src/lib/seoPolicy.js';

const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export function sitemapXml(routes) {
    const urls = [...new Set(routes.filter(isIndexablePath).map(canonicalUrl))];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
}

export function sitemapPlugin(routes, { isolated = false } = {}) {
    return {
        name: 'bcs-public-sitemap',
        apply: 'build',
        generateBundle() {
            // One explicit source; do not discover HTML files again after prerendering.
            this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(isolated ? [] : routes) });
        },
    };
}

export async function fetchPublicRoutes(client, { pageSize = 500 } = {}) {
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) throw new Error('Invalid catalogue page size');
    async function readAll(table, columns, activeOnly = false) {
        const rows = [];
        let expectedCount;
        while (rows.length < 50000) {
            let query = client.from(table).select(columns, { count: 'exact' }).order('id', { ascending: true });
            if (activeOnly) query = query.eq('is_active', true);
            const { data, error, count } = await query.range(rows.length, rows.length + pageSize - 1);
            if (error) throw new Error(`Cannot build public routes: ${table} query failed`, { cause: error });
            if (!Array.isArray(data) || !Number.isInteger(count) || count < 0) throw new Error(`Invalid ${table} catalogue response`);
            if (expectedCount !== undefined && expectedCount !== count) throw new Error(`${table} changed while building routes; retry the build`);
            expectedCount = count;
            rows.push(...data);
            if (rows.length === count) return rows;
            if (!data.length || rows.length > count) throw new Error(`Incomplete ${table} catalogue`);
        }
        throw new Error(`${table} catalogue exceeds the single-sitemap limit`);
    }
    const [products, courses] = await Promise.all([
        readAll('products', 'id,is_active', true),
        readAll('courses', 'id'),
    ]);
    return publicRoutes({ products, courses });
}

function attribute(tag, name) {
    return tag?.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1];
}

export function assertRenderedRoute(rendered, { expectedNoindex = !isIndexablePath(rendered.route) } = {}) {
    const htmlTag = rendered.html.match(/<html\b[^>]*>/i)?.[0];
    if (attribute(htmlTag, 'data-bcs-render-status') !== 'ready'
        || attribute(htmlTag, 'data-bcs-render-path') !== rendered.route) {
        throw new Error(`Prerender content is not ready for ${rendered.route}`);
    }
    const canonical = (rendered.html.match(/<link\b[^>]*>/gi) || []).find(tag => attribute(tag, 'rel') === 'canonical');
    if (attribute(canonical, 'href') !== canonicalUrl(rendered.route)) throw new Error(`Incorrect canonical for ${rendered.route}`);
    const robots = (rendered.html.match(/<meta\b[^>]*>/gi) || []).find(tag => attribute(tag, 'name') === 'robots');
    const noindex = /\bnoindex\b/i.test(attribute(robots, 'content') || '');
    if (noindex !== expectedNoindex) throw new Error(`Incorrect indexing policy for ${rendered.route}`);
    return rendered;
}
