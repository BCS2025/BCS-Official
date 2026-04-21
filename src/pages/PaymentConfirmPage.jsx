import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Home, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { confirmLinePayPayment } from '../lib/paymentService';
import { formatCurrency } from '../lib/pricing';
import { usePageMeta } from '../hooks/usePageMeta';

export default function PaymentConfirmPage() {
    usePageMeta('付款確認中・販創所', '比創空間・販創所正在確認您的 LINE Pay 付款結果。', { noindex: true });
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');
    const [result, setResult] = useState(null);
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        const orderId = params.get('orderId');
        const transactionId = params.get('transactionId');

        if (!orderId || !transactionId) {
            setStatus('error');
            setMessage('缺少訂單編號或交易編號，無法確認付款。');
            return;
        }

        confirmLinePayPayment({ orderId, transactionId })
            .then((data) => {
                setResult(data);
                setStatus('success');
            })
            .catch((err) => {
                console.error('confirmLinePayPayment error:', err);
                setMessage(err.message || 'LINE Pay 付款確認失敗');
                setStatus('error');
            });
    }, [params]);

    if (status === 'loading') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="animate-spin text-store-500 mb-4" size={48} />
                <h2 className="text-xl font-bold text-bcs-black">正在確認 LINE Pay 付款...</h2>
                <p className="text-sm text-bcs-muted mt-2">請勿關閉或重新整理此頁面。</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 space-y-6 border border-bcs-border">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                        <XCircle size={40} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-bcs-black">付款確認失敗</h2>
                    <p className="text-sm text-bcs-muted">{message}</p>
                    <p className="text-xs text-bcs-muted">
                        若款項已扣除，請透過 LINE 聯繫客服（附上訂單編號），我們將為您處理。
                    </p>
                    <div className="flex flex-col gap-2">
                        <Link to="/store/products">
                            <Button className="w-full"><ShoppingBag size={18} className="mr-2" />回到商品頁</Button>
                        </Link>
                        <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                            <Home size={18} className="mr-2" />返回首頁
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 space-y-6 border border-bcs-border text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={40} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-bcs-black">
                    {result?.alreadyPaid ? '此訂單已完成付款' : 'LINE Pay 付款成功！'}
                </h2>
                <div className="bg-store-50 p-4 rounded-lg space-y-2 text-left">
                    <div className="flex justify-between text-sm">
                        <span className="text-bcs-muted">訂單編號</span>
                        <span className="font-mono font-bold">{result?.orderId}</span>
                    </div>
                    {result?.totalAmount && (
                        <div className="flex justify-between text-sm">
                            <span className="text-bcs-muted">付款金額</span>
                            <span className="font-bold text-red-600">{formatCurrency(result.totalAmount)}</span>
                        </div>
                    )}
                    {result?.transactionId && (
                        <div className="flex justify-between text-sm">
                            <span className="text-bcs-muted">LINE Pay 交易</span>
                            <span className="font-mono text-xs">{result.transactionId}</span>
                        </div>
                    )}
                </div>
                <p className="text-sm text-bcs-muted">
                    訂單明細已寄至您的 Email，我們將盡快為您製作與出貨。
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
