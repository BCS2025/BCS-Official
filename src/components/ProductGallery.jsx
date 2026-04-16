import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/pricing';
import { getImageUrl } from '../lib/imageUtils';
import { ArrowUpDown } from 'lucide-react';

export default function ProductGallery({ products = [] }) {
    const [sortBy, setSortBy] = useState('featured');

    const sortedProducts = useMemo(() => {
        const sorted = [...products];
        if (sortBy === 'price-asc') {
            return sorted.sort((a, b) => a.price - b.price);
        }
        if (sortBy === 'price-desc') {
            return sorted.sort((a, b) => b.price - a.price);
        }
        if (sortBy === 'newest') {
            return sorted.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA; // Newest first
            });
        }
        return sorted; // 'featured' uses original order (database default or fetch order)
    }, [sortBy, products]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <section className="text-center space-y-2 mb-12">
                <h1 className="text-4xl font-serif font-bold text-wood-900 mb-4">創意 生活 文創 教育</h1>
                <p className="text-wood-600 max-w-2xl mx-auto">
                    為您的生活增添一份溫暖的小物，每一件作品都是獨一無二的專屬訂製。
                </p>
                {/* Free Shipping Banner */}
                <div className="inline-block mt-4 bg-red-100 border border-red-200 rounded-full px-4 py-1.5 animate-bounce-slow">
                    <span className="flex items-center gap-2 text-red-700 font-bold text-sm">
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">HOT</span>
                        全館滿 $599 免運活動開跑中！
                    </span>
                </div>
            </section>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <p className="text-wood-600 font-medium">
                    共 <span className="text-wood-900 font-bold">{sortedProducts.length}</span> 項商品
                </p>
                <div className="flex items-center gap-2">
                    <ArrowUpDown size={16} className="text-wood-500" />
                    <span className="text-sm text-wood-600 hidden sm:inline">排序方式：</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-white border border-wood-200 rounded-lg px-3 py-2 text-sm text-wood-800 focus:outline-none focus:ring-2 focus:ring-wood-400 cursor-pointer hover:border-wood-300 transition-colors"
                    >
                        <option value="featured">✨ 精選推薦</option>
                        <option value="newest">🆕 最新上架</option>
                        <option value="price-asc">💰 價格：由低到高</option>
                        <option value="price-desc">💎 價格：由高到低</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-wood-100 overflow-hidden group flex flex-col">
                        <div className="aspect-square w-full overflow-hidden bg-wood-50 relative">
                            <img
                                src={getImageUrl(product.image)}
                                alt={product.name}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                        </div>

                        <div className="p-6 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-wood-900">{product.name}</h3>
                                {/* New Label */}
                                {(new Date(product.createdAt) > new Date('2023-12-01')) && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">NEW</span>
                                )}
                            </div>
                            <p className="text-wood-500 text-sm mb-4 line-clamp-2 flex-grow">{product.slogan || product.description}</p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-wood-50">
                                <span className="text-lg font-bold text-wood-800">
                                    {product.isOnSale ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-wood-400 line-through">
                                                {formatCurrency(product.originalPrice)}
                                            </span>
                                            <span className="text-red-600 font-bold">
                                                {formatCurrency(product.price)}
                                            </span>
                                        </div>
                                    ) : (
                                        product.fields.length > 0 ? (
                                            <span>From {formatCurrency(product.price)}</span>
                                        ) : (
                                            formatCurrency(product.price)
                                        )
                                    )}
                                </span>
                                <Link
                                    to={`/store/product/${product.id}`}
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
