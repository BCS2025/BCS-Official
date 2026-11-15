import variants from '../data/imageVariants.json';
import { getImageUrl } from './imageUtils';

// Only reviewed local originals have derivatives. Uploaded/remote image URLs stay intact.
export function responsiveImageProps(source) {
    const fallback = { src: getImageUrl(source) };
    if (!source || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(source) || /[?#]/.test(source)) return fallback;
    let key;
    try { key = '/' + decodeURIComponent(source).replace(/^\/+/, ''); }
    catch { return fallback; }
    const image = variants[key];
    if (!image) return fallback;
    const preferred = image.variants.find(variant => variant.width >= 640) || image.variants.at(-1);
    return { src: getImageUrl(preferred.src), width: image.width, height: image.height,
        srcSet: image.variants.map(variant => `${getImageUrl(variant.src)} ${variant.width}w`).join(', '),
        ...(image.avif ? { avifSrcSet: image.avif.map(variant => `${getImageUrl(variant.src)} ${variant.width}w`).join(', ') } : {}) };
}
