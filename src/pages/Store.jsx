import { Link } from 'react-router-dom';
import { ShoppingBag, Layers, Lightbulb, ArrowRight } from 'lucide-react';

const CATEGORIES = [
    {
        key: 'creative',
        icon: <Lightbulb size={28} className="text-store-500" />,
        title: '創作商品',
        desc: '壓克力燈、雷射雕刻、客製鑰匙圈——融合設計與工藝的生活好物。',
        to: '/store/products?cat=creative',
    },
    {
        key: 'materials',
        icon: <Layers size={28} className="text-store-500" />,
        title: '創客材料',
        desc: 'Arduino 套件、電子零件、材料包——動手做的起點，從這裡開始。',
        to: '/store/products?cat=materials',
    },
];

const FEATURES = [
    { title: '客製化服務', desc: '從設計到成品，提供完整的個人化訂製體驗。' },
    { title: '雷射精工', desc: '自有雷射切割機，精確加工，品質把關。' },
    { title: '3D 列印', desc: '快速打樣，複雜造型一次成形。' },
    { title: '安心購物', desc: '每件商品都是比創空間親手製作，品質保證。' },
];

export default function Store() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="bg-store-50 border-b border-store-100">
                <div className="max-w-5xl mx-auto px-4 py-20 text-center">
                    <div className="inline-flex items-center gap-2 bg-store-500/10 text-store-700 text-sm font-bold px-4 py-1.5 rounded-full mb-6">
                        <ShoppingBag size={14} />
                        販創所
                    </div>
                    <h1 className="text-5xl font-serif font-bold text-bcs-black mb-4 leading-tight">
                        創意，從這裡開始
                    </h1>
                    <p className="text-bcs-muted text-lg max-w-xl mx-auto mb-8">
                        比創空間旗下的文創電商，販售設計師原創商品與創客材料，讓每一份禮物都有靈魂。
                    </p>
                    <Link
                        to="/store/products"
                        className="inline-flex items-center gap-2 bg-store-500 hover:bg-store-700 text-white font-bold px-8 py-3.5 rounded-btn transition-colors text-base"
                    >
                        立即逛商品
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Category Cards */}
            <section className="max-w-5xl mx-auto px-4 py-16">
                <h2 className="text-2xl font-serif font-bold text-bcs-black text-center mb-10">商品分類</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {CATEGORIES.map(cat => (
                        <Link
                            key={cat.key}
                            to={cat.to}
                            className="group bg-white border border-bcs-border rounded-card p-8 hover:border-store-300 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 bg-store-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-store-100 transition-colors">
                                {cat.icon}
                            </div>
                            <h3 className="text-xl font-bold text-bcs-black mb-2">{cat.title}</h3>
                            <p className="text-bcs-muted text-sm leading-relaxed mb-4">{cat.desc}</p>
                            <span className="inline-flex items-center gap-1 text-store-500 font-bold text-sm group-hover:gap-2 transition-all">
                                瀏覽商品 <ArrowRight size={14} />
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="bg-bcs-gray border-t border-bcs-border">
                <div className="max-w-5xl mx-auto px-4 py-16">
                    <h2 className="text-2xl font-serif font-bold text-bcs-black text-center mb-10">為什麼選擇販創所</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {FEATURES.map(f => (
                            <div key={f.title} className="bg-white rounded-card p-6 border border-bcs-border">
                                <div className="w-2 h-8 bg-store-500 rounded-full mb-4" />
                                <h3 className="font-bold text-bcs-black mb-1.5">{f.title}</h3>
                                <p className="text-bcs-muted text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-5xl mx-auto px-4 py-16 text-center">
                <h2 className="text-3xl font-serif font-bold text-bcs-black mb-4">找不到想要的款式？</h2>
                <p className="text-bcs-muted mb-6">鍛造工坊提供完整的客製代工服務，雷射切割、3D 列印都能做。</p>
                <Link
                    to="/forge"
                    className="inline-flex items-center gap-2 border-2 border-bcs-black text-bcs-black hover:bg-bcs-black hover:text-white font-bold px-6 py-3 rounded-btn transition-colors"
                >
                    前往鍛造工坊詢價 <ArrowRight size={16} />
                </Link>
            </section>
        </div>
    );
}
