import { responsiveImageProps } from '../lib/responsiveImages';

export default function ResponsiveImage({ src, sizes, loading = 'lazy', fetchPriority = 'auto', ...props }) {
    const { avifSrcSet, ...image } = responsiveImageProps(src);
    const element = <img {...image} {...props} sizes={image.srcSet ? sizes : undefined}
        loading={loading} decoding="async" fetchPriority={fetchPriority} />;
    return avifSrcSet ? <picture className="contents">
        <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
        {element}
    </picture> : element;
}
