import { useSearchParams, Link } from 'react-router-dom';
import { Truck, ShoppingBag, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { usePageMeta } from '../hooks/usePageMeta';
import LogisticsTracking from '../components/LogisticsTracking';

export default function TrackOrderPage() {
    usePageMeta('物流追蹤・販創所', '查看您販創所訂單的綠界物流狀態。', { noindex: true });
    const [params] = useSearchParams();
    const orderId = (params.get('orderId') || '').trim();

    if (!orderId) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 space-y-4 border border-bcs-border text-center">
                    <h2 className="text-xl font-bold text-bcs-black">缺少訂單編號</h2>
                    <p className="text-sm text-bcs-muted">
                        請從訂單確認信件中的「物流追蹤」連結進入，或直接在網址加上 <code className="text-xs bg-store-50 px-1 rounded">?orderId=...</code>。
                    </p>
                    <div className="flex flex-col gap-2">
                        <Link to="/store/products">
                            <Button className="w-full"><ShoppingBag size={16} className="mr-2" />回到商品</Button>
                        </Link>
                        <Link to="/">
                            <Button variant="outline" className="w-full"><Home size={16} className="mr-2" />返回首頁</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 space-y-5 border border-bcs-border">
                <div className="flex items-center gap-2">
                    <Truck size={22} className="text-store-500" />
                    <h2 className="text-xl font-bold text-bcs-black">物流追蹤</h2>
                </div>
                <div className="text-sm text-bcs-muted bg-store-50 rounded-md p-3">
                    訂單編號：<span className="font-mono font-bold text-bcs-black">{orderId}</span>
                </div>
                <LogisticsTracking orderId={orderId} />
                <div className="flex flex-col gap-2 pt-2">
                    <Link to="/store/products">
                        <Button variant="outline" className="w-full"><ShoppingBag size={16} className="mr-2" />繼續逛逛</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
