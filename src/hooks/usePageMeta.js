import { useEffect } from 'react';

const BASE_TITLE = '比創空間 | Be Creative Space';

/**
 * 設定頁面 <title> 與 <meta name="description">
 * @param {string} title     - 頁面標題（不含 site name）
 * @param {string} description - meta description
 */
export function usePageMeta(title, description) {
    useEffect(() => {
        document.title = title ? `${title} | 比創空間` : BASE_TITLE;

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = description || '比創空間——販創所、鍛造工坊、創客世界，融合文創電商、代工製作與 STEAM 教育的創客空間。';

        return () => {
            document.title = BASE_TITLE;
        };
    }, [title, description]);
}
