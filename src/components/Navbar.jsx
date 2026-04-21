import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';

export default function Navbar({ cartCount }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const isStorePage = location.pathname.startsWith('/store');
    const isForge     = location.pathname.startsWith('/forge');
    const isMaker     = location.pathname.startsWith('/makerworld');
    const isAbout     = location.pathname === '/about';

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <header className="bg-white border-b border-bcs-border sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo + Brand Name + Desktop Nav */}
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" onClick={closeMobileMenu}>
                        <img
                            src={`${import.meta.env.BASE_URL}WebsiteTopLogoIcon.png`}
                            alt="比創空間 Logo"
                            className="h-10 sm:h-12 w-auto object-contain"
                        />
                        <span className="hidden sm:block font-black text-bcs-black text-base tracking-tight">比創空間</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            to="/makerworld"
                            className={`px-4 py-2.5 rounded-lg text-maker-500 font-semibold text-base transition-colors ${
                                isMaker ? 'bg-maker-100' : 'hover:bg-maker-50'
                            }`}
                        >
                            創客世界
                        </Link>
                        <Link
                            to="/forge"
                            className={`px-4 py-2.5 rounded-lg text-forge-500 font-semibold text-base transition-colors ${
                                isForge ? 'bg-forge-100' : 'hover:bg-forge-50'
                            }`}
                        >
                            鍛造工坊
                        </Link>
                        <Link
                            to="/store/products"
                            className={`px-4 py-2.5 rounded-lg text-store-500 font-semibold text-base transition-colors ${
                                isStorePage ? 'bg-store-100' : 'hover:bg-store-50'
                            }`}
                        >
                            販創所
                        </Link>
                        <Link
                            to="/about"
                            className={`px-4 py-2.5 rounded-lg font-medium text-base transition-colors ${
                                isAbout
                                    ? 'text-bcs-black bg-bcs-gray'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            關於我們
                        </Link>
                    </nav>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {isStorePage ? (
                        <Link to="/store/cart" className="relative group cursor-pointer" onClick={closeMobileMenu}>
                            <div className="flex items-center gap-2 text-store-500 hover:text-store-700 transition-colors px-3 py-2">
                                <div className="relative">
                                    <ShoppingCart size={22} />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-store-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                            {cartCount > 9 ? '9+' : cartCount}
                                        </span>
                                    )}
                                </div>
                                <span className="font-semibold text-sm hidden sm:inline">購物車</span>
                            </div>
                        </Link>
                    ) : (
                        cartCount > 0 && (
                            <Link to="/store/cart" className="relative cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors" onClick={closeMobileMenu} title={`購物車（${cartCount}）`}>
                                <ShoppingCart size={20} className="text-gray-400" />
                                <span className="absolute top-0.5 right-0.5 bg-store-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            </Link>
                        )
                    )}

                    {/* Mobile Hamburger */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(v => !v)}
                        aria-label="開啟選單"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-bcs-border shadow-lg py-3 px-4 flex flex-col gap-1">
                    <Link
                        to="/makerworld"
                        className={`p-3 text-maker-500 font-semibold text-base rounded-lg transition-colors ${isMaker ? 'bg-maker-50' : 'hover:bg-maker-50'}`}
                        onClick={closeMobileMenu}
                    >
                        創客世界
                    </Link>
                    <Link
                        to="/forge"
                        className={`p-3 text-forge-500 font-semibold text-base rounded-lg transition-colors ${isForge ? 'bg-forge-50' : 'hover:bg-forge-50'}`}
                        onClick={closeMobileMenu}
                    >
                        鍛造工坊
                    </Link>
                    <Link
                        to="/store/products"
                        className={`p-3 text-store-500 font-semibold text-base rounded-lg transition-colors ${isStorePage ? 'bg-store-50' : 'hover:bg-store-50'}`}
                        onClick={closeMobileMenu}
                    >
                        販創所
                    </Link>
                    <Link
                        to="/about"
                        className={`p-3 text-gray-600 text-base rounded-lg transition-colors ${isAbout ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                        onClick={closeMobileMenu}
                    >
                        關於我們
                    </Link>
                    {cartCount > 0 && (
                        <Link
                            to="/store/cart"
                            className="p-3 text-store-500 font-semibold text-base hover:bg-store-50 rounded-lg transition-colors flex items-center gap-2 border-t border-bcs-border mt-1 pt-4"
                            onClick={closeMobileMenu}
                        >
                            <ShoppingCart size={18} />
                            購物車（{cartCount}）
                        </Link>
                    )}
                </div>
            )}
        </header>
    );
}
