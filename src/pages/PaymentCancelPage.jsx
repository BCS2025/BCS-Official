import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { XOctagon, ShoppingBag, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { usePageMeta } from '../hooks/usePageMeta';

export default function PaymentCancelPage() {
    usePageMeta('付款已取消・販創所', '您已取消 LINE Pay 付款。', { noindex: true });
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const orderId = params.get('orderId');

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 space-y-6 border border-bcs-border text-center">
                <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto">
                    <XOctagon size={40} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-bcs-black">付款已取消</h2>
                {orderId && (
                    <p className="text-sm text-bcs-muted">
                        訂單編號 <span className="font-mono font-bold text-bcs-black">{orderId}</span> 已保留，
                        您可以重新前往 LINE Pay 付款，或改選銀行轉帳。
                    </p>
                )}
                <p className="text-xs text-bcs-muted">
                    如需協助請透過 LINE 官方帳號聯繫客服。
                </p>
                <div className="flex flex-col gap-2">
                    <Link to="/store/products">
                        <Button className="w-full"><ShoppingBag size={18} className="mr-2" />繼續逛逛</Button>
                    </Link>
                    <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                        <Home size={18} className="mr-2" />返回首頁
                    </Button>
                </div>
            </div>
        </div>
    );
}
