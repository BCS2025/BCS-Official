
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../data/products';
import ProductForm from './ProductForm';
import { ArrowLeft } from 'lucide-react';

export default function ProductDetail({ onAddToCart }) {
    const { id } = useParams();
    const product = getProductById(id);

    if (!product) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-wood-900">找不到此商品</h2>
                <Link to="/" className="text-wood-600 hover:underline mt-4 inline-block">返回首頁</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link to="/" className="inline-flex items-center gap-2 text-wood-600 hover:text-wood-800 mb-6 transition-colors">
                <ArrowLeft size={20} />
                回到商品列表
            </Link>

            <div className="grid md:grid-cols-2 gap-12 items-start">
                {/* Product Image */}
                <div className="rounded-2xl overflow-hidden shadow-sm border border-wood-100 bg-white p-2">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-auto rounded-xl object-cover"
                    />
                    <div className="p-4 bg-wood-50 rounded-lg mt-2">
                        <h1 className="text-2xl font-serif font-bold text-wood-900 mb-2">{product.name}</h1>
                        <p className="text-wood-600 text-sm whitespace-pre-line leading-relaxed">{product.description}</p>
                    </div>
                </div>

                {/* Config Form */}
                <div className="md:sticky md:top-24">
                    {product.fields.length > 0 ? (
                        <ProductForm
                            product={product}
                            onAddToCart={onAddToCart}
                        />
                    ) : (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-wood-200 text-center py-12">
                            <p className="text-wood-500 text-lg">Coming Soon... 此商品即將開放訂購</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
