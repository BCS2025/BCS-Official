// Used only by the build renderer, never shipped as a browser access policy.
const database = 'https://qpdpsgmpqkxeqboyapwp.supabase.co';
const publicTables = new Set(['products', 'shipping_methods', 'courses', 'class_locations', 'forge_portfolio', 'quote_materials']);
export function publicBuildRequest(url, method) {
    const u = new URL(url);
    if (['data:', 'blob:'].includes(u.protocol)) return true;
    if (u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname)) return method === 'GET' && !u.pathname.startsWith('/api/');
    if (u.origin === database) {
        if (method === 'OPTIONS') return publicTables.has(u.pathname.replace('/rest/v1/', '')) || u.pathname === '/rest/v1/rpc/calculate_max_stock' || u.pathname.startsWith('/storage/v1/object/public/');
        if (method === 'GET' && publicTables.has(u.pathname.replace('/rest/v1/', ''))) return true;
        if (method === 'GET' && u.pathname.startsWith('/storage/v1/object/public/')) return true;
        // Existing read-only function: calculates availability, no reservation or mutation.
        return method === 'POST' && u.pathname === '/rest/v1/rpc/calculate_max_stock';
    }
    return method === 'GET' && ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(u.origin);
}
export async function setupReadOnlyPrerender(page) {
    // The pinned renderer installs an unconditional continue listener first.
    // Replace it before navigation so it cannot bypass this build-only policy.
    page.removeAllListeners('request');
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.isInterceptResolutionHandled()) return;
        if (publicBuildRequest(request.url(), request.method())) return request.continue();
        // Prevent analytics, notifications and all transaction requests during builds.
        return request.respond({ status: 204, body: '' });
    });
}
