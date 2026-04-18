import { useEffect } from 'react';

const SITE_NAME = '比創空間';
const BASE_TITLE = '比創空間 Be Creative Space | 文創電商・代工製作・STEAM 教育';
const DEFAULT_DESCRIPTION = '比創空間——由工程師與設計師共同打造的創客工坊，旗下三品牌：販創所（文創電商）、鍛造工坊（雷射切割・3D 列印代工）、創客世界（STEAM 兒童課程）。台南永康在地品牌。';
const DEFAULT_IMAGE = 'https://bcs.tw/og-image.png';
const SITE_ORIGIN = 'https://bcs.tw';

function upsertMeta(selector, attrs) {
    let el = document.head.querySelector(selector);
    if (!el) {
        el = document.createElement('meta');
        for (const [k, v] of Object.entries(attrs.create || {})) {
            el.setAttribute(k, v);
        }
        document.head.appendChild(el);
    }
    el.setAttribute('content', attrs.content);
    return el;
}

function upsertLink(rel, href) {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
    return el;
}

/**
 * 設定頁面 title、meta description、Open Graph、Twitter Card 與 canonical link。
 * Prerender 時 Puppeteer 會捕捉這些寫入 <head>，於是每條路由產出各自的 SEO tag。
 *
 * @param {string} title - 頁面標題（不含 site name）
 * @param {string} [description] - meta description
 * @param {object} [options]
 * @param {string} [options.image] - og:image 絕對 URL（未提供則用 og-image.png）
 * @param {string} [options.path]  - 頁面路徑（未提供則用 location.pathname）
 * @param {boolean} [options.noindex] - 設為 true 時加入 robots: noindex（如購物車）
 */
export function usePageMeta(title, description, options = {}) {
    const { image, path, noindex = false } = options;

    useEffect(() => {
        const fullTitle = title ? `${title} | ${SITE_NAME}` : BASE_TITLE;
        const desc = description || DEFAULT_DESCRIPTION;
        const img = image || DEFAULT_IMAGE;
        const pagePath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
        const url = `${SITE_ORIGIN}${pagePath}`;

        document.title = fullTitle;

        upsertMeta('meta[name="description"]', {
            create: { name: 'description' },
            content: desc,
        });

        upsertMeta('meta[property="og:title"]', {
            create: { property: 'og:title' },
            content: fullTitle,
        });
        upsertMeta('meta[property="og:description"]', {
            create: { property: 'og:description' },
            content: desc,
        });
        upsertMeta('meta[property="og:url"]', {
            create: { property: 'og:url' },
            content: url,
        });
        upsertMeta('meta[property="og:image"]', {
            create: { property: 'og:image' },
            content: img,
        });

        upsertMeta('meta[name="twitter:title"]', {
            create: { name: 'twitter:title' },
            content: fullTitle,
        });
        upsertMeta('meta[name="twitter:description"]', {
            create: { name: 'twitter:description' },
            content: desc,
        });
        upsertMeta('meta[name="twitter:image"]', {
            create: { name: 'twitter:image' },
            content: img,
        });

        upsertLink('canonical', url);

        // robots: noindex（僅用於購物車等不該被索引的頁面）
        const existingRobots = document.head.querySelector('meta[name="robots"]');
        if (noindex) {
            upsertMeta('meta[name="robots"]', {
                create: { name: 'robots' },
                content: 'noindex, nofollow',
            });
        } else if (existingRobots) {
            existingRobots.remove();
        }

        return () => {
            document.title = BASE_TITLE;
        };
    }, [title, description, image, path, noindex]);
}
