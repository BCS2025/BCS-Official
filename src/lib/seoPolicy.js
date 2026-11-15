export const SITE_ORIGIN = 'https://www.bcs.tw';
export const INDEXED_STATIC_ROUTES = ['/', '/about', '/store', '/store/products', '/forge', '/makerworld', '/terms', '/returns'];
export const NOINDEX_PRERENDER_ROUTES = ['/store/cart'];

export function canonicalUrl(path = '/') {
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
        throw new Error('Canonical path must be a local absolute path');
    }
    const url = new URL(path, SITE_ORIGIN);
    url.search = '';
    url.hash = '';
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url.href;
}

export function isIndexablePath(path) {
    const pathname = new URL(canonicalUrl(path)).pathname;
    return INDEXED_STATIC_ROUTES.includes(pathname)
        || /^\/store\/product\/[^/]+$/.test(pathname)
        || /^\/makerworld\/[^/]+$/.test(pathname);
}

export function publicRoutes({ products = [], courses = [] } = {}) {
    const routeFor = (prefix, row) => {
        if (typeof row.id !== 'string' || !row.id.trim() || ['.', '..'].includes(row.id)) {
            throw new Error('Public catalogue contains an invalid route ID');
        }
        return `${prefix}/${encodeURIComponent(row.id)}`;
    };
    return [...new Set([
        ...INDEXED_STATIC_ROUTES,
        ...products.filter(product => product.is_active === true).map(product => routeFor('/store/product', product)),
        // Match the existing anonymous course catalogue, including full/closed archives.
        ...courses.map(course => routeFor('/makerworld', course)),
    ])];
}
