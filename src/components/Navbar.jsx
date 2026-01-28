
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function Navbar({ cartCount }) {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img
                        src={`${import.meta.env.BASE_URL}WebsiteLogoIcon.png`}
                        alt="比創空間 Logo"
                        className="h-14 w-auto object-contain"
                    />
                </Link>
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
        </header>
    );
}
