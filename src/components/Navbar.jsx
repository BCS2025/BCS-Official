import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';

export default function Navbar({ cartCount }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={closeMobileMenu}>
                        <img
                            src={`${import.meta.env.BASE_URL}WebsiteLogoIcon.png`}
                            alt="比創空間 Logo"
                            className="h-12 sm:h-14 w-auto object-contain"
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6 font-medium text-wood-700">
                        <Link to="/about" className="hover:text-wood-900 transition-colors">關於比創</Link>
                        <Link to="/quote" className="text-amber-700 hover:text-amber-800 transition-colors font-bold px-3 py-1 bg-amber-50 rounded-md border border-amber-200">鍛造工坊</Link>
                    </nav>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                    {/* Cart Icon */}
                    <Link to="/cart" className="relative group cursor-pointer" onClick={closeMobileMenu}>
                        <div className="flex items-center gap-2 text-wood-600 group-hover:text-wood-800 transition-colors p-2 md:p-0">
                            <div className="relative">
                                <ShoppingCart size={24} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                            <span className="font-medium hidden sm:inline">購物車</span>
                        </div>
                    </Link>

                    {/* Mobile Hamburger Button */}
                    <button 
                        className="md:hidden p-2 text-wood-700 hover:text-wood-900 hover:bg-wood-100 rounded-lg transition-colors"
                        onClick={toggleMobileMenu}
                        aria-label="開啟選單"
                    >
                        {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-wood-100 shadow-lg py-2 px-4 flex flex-col gap-2">
                    <Link 
                        to="/about" 
                        className="p-3 text-wood-700 font-medium hover:bg-wood-50 rounded-lg transition-colors flex items-center"
                        onClick={closeMobileMenu}
                    >
                        關於比創
                    </Link>
                    <Link 
                        to="/quote" 
                        className="p-3 text-amber-800 font-bold bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors flex items-center"
                        onClick={closeMobileMenu}
                    >
                        鍛造工坊 (客製化專區)
                    </Link>
                </div>
            )}
        </header>
    );
}
