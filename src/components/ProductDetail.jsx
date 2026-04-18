
import { useParams, Link } from 'react-router-dom';
import ProductForm from './ProductForm';
import { getImageUrl } from '../lib/imageUtils';
import { ArrowLeft } from 'lucide-react';
import ProductImageCarousel from './ProductImageCarousel';
import { usePageMeta } from '../hooks/usePageMeta';

const SITE_ORIGIN = 'https://bcs.tw';

function buildProductDescription(product) {
    if (!product) return undefined;
    const raw = product.slogan || product.description || product.detailedDescription || '';
    const plain = raw.replace(/\s+/g, ' ').replace(/\*\*/g, '').trim();
    if (!plain) return undefined;
    return plain.length > 140 ? `${plain.slice(0, 137)}...` : plain;
}

function buildAbsoluteImage(path) {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    const resolved = getImageUrl(path);
    if (resolved.startsWith('http')) return resolved;
    return `${SITE_ORIGIN}${resolved.startsWith('/') ? '' : '/'}${resolved}`;
}

export default function ProductDetail({ products, cart, onAddToCart }) {
    const { id } = useParams();
    const product = products.find(p => p.id === id);

    usePageMeta(
        product ? `${product.name}・販創所` : '商品詳情・販創所',
        product ? buildProductDescription(product) : undefined,
        product ? { image: buildAbsoluteImage((product.images && product.images[0]) || product.image) } : undefined,
    );

    if (!product) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-bcs-black">找不到此商品</h2>
                <Link to="/store/products" className="text-store-500 hover:underline mt-4 inline-block">返回商品列表</Link>
            </div>
        );
    }


    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link to="/store/products" className="inline-flex items-center gap-2 text-store-500 hover:text-store-700 mb-6 transition-colors">
                <ArrowLeft size={20} />
                回到商品列表
            </Link>

            <div className="grid md:grid-cols-2 gap-12 items-start">
                {/* Product Image */}
                <div className="rounded-2xl overflow-hidden shadow-sm border border-bcs-border bg-white p-2">
                    <ProductImageCarousel
                        images={product.images && product.images.length > 0 ? product.images : [product.image]}
                        productName={product.name}
                    />
                    <div className="p-4 bg-store-50 rounded-lg mt-2">
                        <h1 className="text-2xl font-serif font-bold text-bcs-black mb-2">{product.name}</h1>
                        {product.slogan && (
                            <p className="text-sm font-bold text-amber-700 mb-4 bg-amber-50 inline-block px-3 py-1 rounded border border-amber-200">
                                ✨ {product.slogan}
                            </p>
                        )}
                        <div className="text-bcs-muted text-sm leading-relaxed space-y-2">
                            {(product.detailedDescription || product.description || '').split('\n').map((line, index) => (
                                <p key={index}
                                    className={line.trim().startsWith('---') ? "border-t border-bcs-border my-4" : "min-h-[1.5em]"}
                                    dangerouslySetInnerHTML={{
                                        __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-bcs-black">$1</strong>')
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Config Form */}
                <div className="md:sticky md:top-24">
                    <ProductForm
                        product={{ ...product, fields: product.fields || [] }}
                        cart={cart}
                        onAddToCart={onAddToCart}
                    />
                </div>
            </div>
        </div>
    );
}
