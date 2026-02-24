
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function Navbar({ cartCount }) {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <img
                            src={`${import.meta.env.BASE_URL}WebsiteLogoIcon.png`}
                            alt="比創空間 Logo"
                            className="h-14 w-auto object-contain"
                        />
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 font-medium text-wood-700">
                        <Link to="/about" className="hover:text-wood-900 transition-colors">關於比創</Link>
                        <Link to="/quote" className="text-amber-700 hover:text-amber-800 transition-colors font-bold px-3 py-1 bg-amber-50 rounded-md border border-amber-200">鍛造工坊</Link>
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    {/* Mobile nav links */}
                    <nav className="flex md:hidden items-center gap-4 font-medium text-wood-700">
                        <Link to="/about" className="hover:text-wood-900 transition-colors text-sm">關於</Link>
                        <Link to="/quote" className="text-amber-700 hover:text-amber-800 transition-colors font-bold text-sm bg-amber-50 px-2 py-1 rounded-md border border-amber-200">鍛造工坊</Link>
                    </nav>

                    <Link to="/cart" className="relative group cursor-pointer">
                        <div className="flex items-center gap-2 text-wood-600 group-hover:text-wood-800 transition-colors">
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
                </div>
            </div>
        </header>
    );
}
