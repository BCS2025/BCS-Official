import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate } from 'react-router-dom';

export const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            console.log('Login successful:', data);
            // Auth state changes will be picked up by AdminLayout's listener
            navigate('/admin');

        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || '登入失敗，請檢查帳號密碼');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">後台管理系統 Login</h1>
                    <p className="text-gray-500 text-sm mt-2">請使用管理員帳號登入</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="admin@bcs.tw"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900" disabled={loading}>
                        {loading ? '登入中...' : '登入 (Sign In)'}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t text-center text-xs text-gray-400">
                    Be Creative Space Admin Panel
                </div>
            </div>
        </div>
    );
};
