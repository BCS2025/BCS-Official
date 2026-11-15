import { describe, it, expect, vi } from 'vitest';
import { publicBuildRequest, setupReadOnlyPrerender } from '../../scripts/seo/prerender-readonly.mjs';
const db = 'https://qpdpsgmpqkxeqboyapwp.supabase.co';
describe('release prerender isolation', () => {
    it('permits public reads and the existing read-only availability calculation', () => {
        expect(publicBuildRequest(`${db}/rest/v1/products?select=*`, 'GET')).toBe(true);
        expect(publicBuildRequest(`${db}/rest/v1/class_locations?select=*`, 'GET')).toBe(true);
        expect(publicBuildRequest(`${db}/rest/v1/products?select=*`, 'OPTIONS')).toBe(true);
        expect(publicBuildRequest(`${db}/rest/v1/orders`, 'OPTIONS')).toBe(false);
        expect(publicBuildRequest(`${db}/rest/v1/rpc/calculate_max_stock`, 'POST')).toBe(true);
        expect(publicBuildRequest('http://localhost:3000/assets/index.js', 'GET')).toBe(true);
    });
    it.each([
        [`${db}/rest/v1/orders`, 'GET'], [`${db}/rest/v1/products`, 'POST'],
        [`${db}/rest/v1/rpc/submit_course_registration`, 'POST'],
        [`${db}/storage/v1/object/files/x`, 'POST'], ['http://localhost:3000/api/linepay/request', 'GET'],
        ['https://www.google-analytics.com/g/collect', 'POST'], ['https://script.google.com/macros/s/x/exec', 'POST'],
        ['https://untrusted.invalid/rest/v1/products', 'GET'],
    ])('blocks non-public request %s %s', (url, method) => expect(publicBuildRequest(url, method)).toBe(false));
    it('replaces the renderer bypass listener before requests are handled', async () => {
        const calls = [];
        const page = { removeAllListeners: vi.fn(() => calls.push('remove')), setRequestInterception: vi.fn(() => calls.push('enable')), on: vi.fn((event, handler) => calls.push(handler)) };
        await setupReadOnlyPrerender(page);
        expect(calls.slice(0, 2)).toEqual(['remove', 'enable']);
        const req = { isInterceptResolutionHandled: () => false, url: () => `${db}/rest/v1/orders`, method: () => 'POST', continue: vi.fn(), respond: vi.fn() };
        calls[2](req);
        expect(req.continue).not.toHaveBeenCalled(); expect(req.respond).toHaveBeenCalledWith({ status: 204, body: '' });
    });
});
