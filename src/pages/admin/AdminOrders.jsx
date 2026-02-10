import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Search, Eye, X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../../lib/pricing';

export const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Fetch Orders
    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            alert('無法讀取訂單: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }

    // Status Update Logic
    const updateOrderStatus = async (orderId, newStatus) => {
        if (!confirm(`確定將訂單狀態更改為 ${newStatus} 嗎？`)) return;

        const timestampField = `${newStatus}_at`; // e.g., paid_at, shipped_at
        const updates = {
            status: newStatus,
            // Only update timestamp if it's a completing action regarding that status
            // But usually we just want to know when it entered that status.
            [timestampField]: new Date().toISOString()
        };

        try {
            const { error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', orderId);

            if (error) throw error;

            // Refresh local state
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, ...updates } : o
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('更新失敗: ' + error.message);
        }
    };

    // Status Helper
    const styles = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        paid: 'bg-blue-100 text-blue-800 border-blue-200',
        shipped: 'bg-purple-100 text-purple-800 border-purple-200',
        completed: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    const labels = {
        pending: '待付款',
        paid: '已付款',
        shipped: '已出貨',
        completed: '已完成',
        cancelled: '已取消'
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">載入中...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">訂單管理 (Orders)</h1>
                <Button onClick={fetchOrders} variant="outline">重整列表</Button>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm font-medium">
                        <tr>
                            <th className="p-4">訂單編號 (ID)</th>
                            <th className="p-4">訂購日期</th>
                            <th className="p-4">客戶姓名</th>
                            <th className="p-4">總金額</th>
                            <th className="p-4">狀態 (點擊修改)</th>
                            <th className="p-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-mono font-bold text-gray-800">{order.order_id}</td>
                                <td className="p-4 text-sm text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString()}
                                    <div className="text-xs text-gray-400">
                                        {new Date(order.created_at).toLocaleTimeString()}
                                    </div>
                                </td>
                                <td className="p-4 font-medium">{order.user_info?.name}</td>
                                <td className="p-4 font-bold text-gray-800">{formatCurrency(order.total_amount)}</td>
                                <td className="p-4">
                                    <select
                                        value={order.status}
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                        className={`px-2 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300 ${styles[order.status] || styles.pending}`}
                                    >
                                        <option value="pending">待付款</option>
                                        <option value="paid">已付款</option>
                                        <option value="shipped">已出貨</option>
                                        <option value="completed">已完成</option>
                                        <option value="cancelled">已取消</option>
                                    </select>
                                    {/* Show timestamp if available */}
                                    {order[`${order.status}_at`] && (
                                        <div className="text-[10px] text-gray-400 mt-1">
                                            {new Date(order[`${order.status}_at`]).toLocaleString()}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)} className="flex items-center gap-1 ml-auto">
                                        <Eye size={16} /> 詳情
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-400">目前沒有訂單資料</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold">訂單詳情 #{selectedOrder.order_id}</h3>
                                <p className="text-xs text-gray-500">
                                    {new Date(selectedOrder.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">👤 客戶資訊</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <p><span className="text-gray-500">姓名:</span> {selectedOrder.user_info?.name}</p>
                                    <p><span className="text-gray-500">電話:</span> {selectedOrder.user_info?.phone}</p>
                                    <p><span className="text-gray-500">Email:</span> {selectedOrder.user_info?.email}</p>
                                    <p><span className="text-gray-500">寄送:</span> {selectedOrder.user_info?.shippingMethod === 'pickup' ? '自取' : '郵寄'}</p>
                                    {selectedOrder.user_info?.address && (
                                        <p className="col-span-2 border-t border-gray-200 pt-2 mt-1">
                                            <span className="text-gray-500">地址:</span> {selectedOrder.user_info?.address}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-3 border-l-4 border-blue-500 pl-2">📦 訂購商品</h4>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-3 border border-gray-200 rounded-lg hover:border-blue-300">
                                            {/* Image */}
                                            {item.image && (
                                                <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                                                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between">
                                                    <h5 className="font-bold text-gray-800">{item.productName || item.productId}</h5>
                                                    <span className="text-sm font-bold text-gray-600">x{item.quantity}</span>
                                                </div>
                                                {/* Specs */}
                                                <div className="mt-1 flex flex-wrap gap-2">
                                                    {Object.entries(item).map(([key, val]) => {
                                                        if (['productId', 'productName', '_id', 'price', 'quantity', 'image'].includes(key)) return null;
                                                        if (key.endsWith('_filename')) return null;
                                                        return (
                                                            <span key={key} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                                {key}: {val}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                                {/* Uploaded File Link */}
                                                {item.image_filename && (
                                                    <a href={item.image} target="_blank" rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 underline mt-2 inline-block">
                                                        查看上傳圖片 ({item.image_filename})
                                                    </a>
                                                )}
                                            </div>
                                            <div className="text-right font-bold text-gray-700">
                                                {formatCurrency(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t border-gray-200 pt-4 flex flex-col items-end space-y-1">
                                <p className="text-sm text-gray-500">商品總計: {formatCurrency(selectedOrder.total_amount - (selectedOrder.user_info?.shippingCost || 0))}</p>
                                <p className="text-sm text-gray-500">運費: {formatCurrency(selectedOrder.user_info?.shippingCost || 0)}</p>
                                <p className="text-xl font-bold text-gray-900 border-t border-gray-300 w-40 text-right pt-2 mt-2">
                                    {formatCurrency(selectedOrder.total_amount)}
                                </p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
                            <Button onClick={() => setSelectedOrder(null)}>關閉</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
