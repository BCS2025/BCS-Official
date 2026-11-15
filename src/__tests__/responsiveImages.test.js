import { describe, it, expect } from 'vitest';
import { responsiveImageProps } from '../lib/responsiveImages';

describe('reviewed local image derivatives', () => {
    it('selects responsive variants and preserves the original aspect ratio', () => {
        const props = responsiveImageProps('/wood-keychain-thumbnails/鑰匙圈版型_圓形.png');
        expect(props.src).toMatch(/^\/image-variants\/[a-f0-9]+-640\.webp$/);
        expect(props.srcSet).toContain('128w');
        expect(props.srcSet).toContain('320w');
        expect(props.srcSet).toContain('640w');
        expect(props.width).toBeGreaterThan(640);
        expect(props.height).toBeGreaterThan(0);
    });
    it('resolves percent-encoded original paths to the same reviewed image', () => {
        const source = '/product-thumbnails/image thumbnail_花磚月曆.png';
        expect(responsiveImageProps(encodeURI(source))).toEqual(responsiveImageProps(source));
    });
    it('offers AVIF for the large calendar image while retaining a WebP fallback', () => {
        const props = responsiveImageProps('/product-thumbnails/image thumbnail_花磚月曆.png');
        expect(props.avifSrcSet).toContain('-768.avif 768w');
        expect(props.src).toMatch(/\.webp$/);
        expect(props.srcSet).toContain('-640.webp 640w');
    });
    it.each(['https://cdn.example.invalid/wood-keychain-thumbnails/鑰匙圈版型_圓形.png',
        '/uploads/new-product.png', '/product-thumbnails/unknown.png',
        '/wood-keychain-thumbnails/鑰匙圈版型_圓形.png?v=2', '/invalid%encoding.png'])(
    'keeps unreviewed or versioned sources unchanged: %s', source => {
        expect(responsiveImageProps(source)).toEqual({ src: source });
    });
});
