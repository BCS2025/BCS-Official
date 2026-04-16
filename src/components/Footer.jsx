import { Link } from 'react-router-dom';
import { Instagram, ShoppingBag, Mail, MapPin } from 'lucide-react';

const BRAND_LINKS = [
    {
        label: '販創所',
        color: 'text-store-500',
        links: [
            { to: '/store', text: '品牌介紹' },
            { to: '/store/products', text: '所有商品' },
            { to: '/store/products?cat=creative', text: '創作商品' },
            { to: '/store/products?cat=materials', text: '創客材料' },
            { to: '/store/cart', text: '購物車' },
        ],
    },
    {
        label: '鍛造工坊',
        color: 'text-forge-500',
        links: [
            { to: '/forge', text: '服務說明' },
            { to: '/forge#portfolio', text: '作品集' },
            { to: '/forge#quote', text: '申請報價' },
        ],
    },
    {
        label: '創客世界',
        color: 'text-maker-500',
        links: [
            { to: '/makerworld', text: '課程列表' },
            { to: '/about', text: '關於我們' },
        ],
    },
];

const SOCIAL_LINKS = [
    {
        label: 'IG @sr2026space',
        href: 'https://www.instagram.com/sr2026space/',
        icon: <Instagram size={18} />,
        color: 'hover:text-pink-500',
    },
    {
        label: '蝦皮 販創所',
        href: 'https://shopee.tw/royshrimp?categoryId=100636&entryPoint=ShopByPDP&itemId=45756384233&upstream=search',
        icon: <ShoppingBag size={18} />,
        color: 'hover:text-store-500',
    },
];

export default function Footer() {
    return (
        <footer className="bg-bcs-black text-white mt-auto">
            <div className="max-w-6xl mx-auto px-4 py-14">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

                    {/* Brand intro */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <img
                                src={`${import.meta.env.BASE_URL}WebsiteTopLogoIcon.png`}
                                alt="比創空間"
                                className="h-9 w-auto object-contain brightness-0 invert"
                            />
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed mb-5">
                            比創空間是由工程師與設計師共同打造的創客空間，整合文創電商、代工製作與 STEAM 教育。
                        </p>

                        {/* Social */}
                        <div className="flex gap-3">
                            {SOCIAL_LINKS.map(s => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={s.label}
                                    className={`flex items-center gap-1.5 text-gray-400 transition-colors text-sm ${s.color}`}
                                >
                                    {s.icon}
                                    <span className="hidden sm:inline">{s.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Brand links */}
                    {BRAND_LINKS.map(brand => (
                        <div key={brand.label}>
                            <h3 className={`font-bold text-sm uppercase tracking-wider mb-4 ${brand.color}`}>
                                {brand.label}
                            </h3>
                            <ul className="space-y-2.5">
                                {brand.links.map(link => (
                                    <li key={link.to}>
                                        <Link
                                            to={link.to}
                                            className="text-sm text-gray-400 hover:text-white transition-colors"
                                        >
                                            {link.text}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 mt-10 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Contact info */}
                    <div className="flex flex-col sm:flex-row gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <Mail size={13} />
                            聯絡請透過 IG DM 或蝦皮站內信
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin size={13} />
                            台南市永康區新興街 34 巷 2-2 號
                        </span>
                    </div>
                    <p className="text-xs text-gray-600">
                        © {new Date().getFullYear()} 比創空間 · 統編 94320625
                    </p>
                </div>
            </div>
        </footer>
    );
}
