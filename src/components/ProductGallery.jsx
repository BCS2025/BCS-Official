import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/pricing';
import { getImageUrl } from '../lib/imageUtils';
import { ArrowUpDown } from 'lucide-react';

const TABS = [
    { key: 'all', label: '全部' },
    { key: 'creative', label: '創作商品' },
    { key: 'materials', label: '創客材料' },
];

export default function ProductGallery({ products = [] }) {
    const [sortBy, setSortBy] = useState('featured');
    const [activeTab, setActiveTab] = useState('all');

    const filteredProducts = useMemo(() => {
        return activeTab === 'all' ? products : products.filter(p => p.category === activeTab);
    }, [activeTab, products]);

    const sortedProducts = useMemo(() => {
        const sorted = [...filteredProducts];
        if (sortBy === 'price-asc') return sorted.sort((a, b) => a.price - b.price);
        if (sortBy === 'price-desc') return sorted.sort((a, b) => b.price - a.price);
        if (sortBy === 'newest') return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return sorted;
    }, [sortBy, filteredProducts]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <section className="text-center space-y-2 mb-10">
                <h1 className="text-4xl font-serif font-bold text-bcs-black mb-3">販創所商品</h1>
                <p className="text-bcs-muted max-w-2xl mx-auto">
                    文創商品、壓克力燈、創客材料——每一件都是獨一無二的專屬訂製。
                </p>
                <div className="inline-block mt-3 bg-store-50 border border-store-300 rounded-full px-4 py-1.5">
                    <span className="flex items-center gap-2 text-store-700 font-bold text-sm">
                        <span className="bg-store-500 text-white text-xs px-2 py-0.5 rounded-full">HOT</span>
                        全館滿 $599 免運活動開跑中！
                    </span>
                </div>
            </section>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 border-b border-bcs-border">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2.5 text-sm font-bold rounded-t-lg transition-colors -mb-px border-b-2 ${
                            activeTab === tab.key
                                ? 'border-store-500 text-store-500 bg-store-50'
                                : 'border-transparent text-bcs-muted hover:text-bcs-black hover:border-bcs-border'
                        }`}
                    >
                        {tab.label}
                        {tab.key !== 'all' && (
                            <span className="ml-1.5 text-xs bg-bcs-gray text-bcs-muted rounded-full px-1.5 py-0.5">
                                {products.filter(p => p.category === tab.key).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <p className="text-bcs-muted font-medium">
                    共 <span className="text-bcs-black font-bold">{sortedProducts.length}</span> 項商品
                </p>
                <div className="flex items-center gap-2">
                    <ArrowUpDown size={16} className="text-bcs-muted" />
                    <span className="text-sm text-bcs-muted hidden sm:inline">排序方式：</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-white border border-bcs-border rounded-lg px-3 py-2 text-sm text-bcs-black focus:outline-none focus:ring-2 focus:ring-store-500 cursor-pointer"
                    >
                        <option value="featured">精選推薦</option>
                        <option value="newest">最新上架</option>
                        <option value="price-asc">價格：由低到高</option>
                        <option value="price-desc">價格：由高到低</option>
                    </select>
                </div>
            </div>

            {/* Product Grid */}
            {sortedProducts.length === 0 ? (
                <div className="text-center py-20 text-bcs-muted">
                    <p className="text-lg">此分類目前沒有商品</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedProducts.map((product) => (
                        <div key={product.id} className="bg-white rounded-card shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 border border-bcs-border overflow-hidden group flex flex-col">
                            <div className="aspect-square w-full overflow-hidden bg-bcs-gray relative">
                                <img
                                    src={getImageUrl(product.image)}
                                    alt={product.name}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                            </div>

                            <div className="p-5 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-1.5">
                                    <h3 className="text-base font-bold text-bcs-black leading-snug">{product.name}</h3>
                                    {product.isOnSale && (
                                        <span className="bg-store-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ml-2">特價</span>
                                    )}
                                </div>
                                <p className="text-bcs-muted text-sm mb-4 line-clamp-2 flex-grow">{product.slogan || product.description}</p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-bcs-border">
                                    <div>
                                        {product.isOnSale ? (
                                            <>
                                                <div className="text-xs text-bcs-muted line-through">{formatCurrency(product.originalPrice)}</div>
                                                <div className="text-lg font-bold text-store-500">{formatCurrency(product.price)}</div>
                                            </>
                                        ) : (
                                            <div className="text-lg font-bold text-bcs-black">
                                                {product.fields?.length > 0 ? `起 ${formatCurrency(product.price)}` : formatCurrency(product.price)}
                                            </div>
                                        )}
                                    </div>
                                    <Link
                                        to={`/store/product/${product.id}`}
                                        className="bg-store-500 hover:bg-store-700 text-white px-4 py-2 rounded-btn text-sm font-bold transition-colors"
                                    >
                                        查看詳情
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
