
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../data/products';
import { formatCurrency } from '../lib/pricing';

export default function ProductGallery() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <section className="text-center space-y-2 mb-12">
                <h1 className="text-4xl font-serif font-bold text-wood-900 mb-4">精選客製化商品</h1>
                <p className="text-wood-600 max-w-2xl mx-auto">
                    為您的生活增添一份溫暖的手作質感，每一件作品都是獨一無二的專屬訂製。
                </p>
                {/* Free Shipping Banner */}
                <div className="inline-block mt-4 bg-red-100 border border-red-200 rounded-full px-4 py-1.5 animate-bounce-slow">
                    <span className="flex items-center gap-2 text-red-700 font-bold text-sm">
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">HOT</span>
                        全館滿 $599 免運活動開跑中！
                    </span>
                </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {PRODUCTS.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-wood-100 overflow-hidden group flex flex-col">
                        <div className="aspect-square w-full overflow-hidden bg-wood-50 relative">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                        </div>

                        <div className="p-6 flex flex-col flex-grow">
                            <h3 className="text-xl font-bold text-wood-900 mb-2">{product.name}</h3>
                            <p className="text-wood-500 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-wood-50">
                                <span className="text-lg font-bold text-wood-800">
                                    {product.fields.length > 0 ? (
                                        <span>From {formatCurrency(product.price)}</span>
                                    ) : (
                                        formatCurrency(product.price)
                                    )}
                                </span>
                                <Link
                                    to={`/product/${product.id}`}
                                    className="bg-wood-600 hover:bg-wood-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    查看詳情
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
