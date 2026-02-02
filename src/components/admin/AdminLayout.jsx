import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { LayoutDashboard, Package, Box, LogOut, Settings } from 'lucide-react';

export const AdminLayout = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
            if (!session) {
                navigate('/admin/login');
            }
        });

        // 2. Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                navigate('/admin/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Admin...</div>;
    }

    if (!session) {
        return null; // Will redirect via useEffect
    }

    // Navigation Items
    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: '總覽 (Dashboard)', exact: true },
        { path: '/admin/orders', icon: Package, label: '訂單管理 (Orders)' }, // Changed Icon for visual distinction
        { path: '/admin/products', icon: Box, label: '商品管理 (Products)' },
        { path: '/admin/inventory', icon: Box, label: '庫存管理 (Inventory)' },
    ];

    const isActive = (path, exact) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-800 text-white flex-shrink-0 flex flex-col">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold tracking-wider">BCS ADMIN</h2>
                    <p className="text-xs text-slate-400 mt-1">Version 2.0 (Auth)</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path, item.exact)
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="truncate max-w-[120px]">{session.user.email}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-900/50 hover:text-red-200 transition-colors text-left"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">登出 (Logout)</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
