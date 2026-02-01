import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Package, Edit, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

// Simple "Secret" for MVP (Replace with real Auth later)
const ADMIN_SECRET = 'bcs_admin_2024';

export const AdminLayout = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const storedAuth = localStorage.getItem('admin_auth');
        if (storedAuth === ADMIN_SECRET) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === ADMIN_SECRET) {
            localStorage.setItem('admin_auth', ADMIN_SECRET);
            setIsAuthenticated(true);
        } else {
            alert('密碼錯誤');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_auth');
        setIsAuthenticated(false);
        navigate('/');
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">後台管理登入</h2>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="請輸入管理員密碼"
                        className="w-full p-2 border border-gray-300 rounded mb-4"
                    />
                    <Button type="submit" className="w-full">登入</Button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-800 text-white flex-shrink-0">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Shield size={20} className="text-yellow-400" />
                        BCS 管理後台
                    </h1>
                </div>
                <nav className="p-4 space-y-2">
                    <Link
                        to="/admin/products"
                        className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${location.pathname.includes('/products') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <Package size={20} />
                        商品管理 (Products)
                    </Link>
                    <Link
                        to="/admin/inventory"
                        className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${location.pathname.includes('/inventory') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <Edit size={20} />
                        庫存管理 (Inventory)
                    </Link>
                </nav>
                <div className="p-4 mt-auto border-t border-slate-700">
                    <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-white w-full">
                        <LogOut size={18} />
                        登出
                    </button>
                    <Link to="/" className="block mt-4 text-xs text-slate-500 hover:text-slate-300 text-center">
                        返回前台首頁
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};
