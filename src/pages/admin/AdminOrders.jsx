import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Search, Eye, X, ChevronDown, ChevronUp, Archive, RefreshCw, Trash2, Edit } from 'lucide-react';
import { formatCurrency } from '../../lib/pricing';

export const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [viewMode, setViewMode] = useState('active'); // 'active' | 'archived'
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [isSavingNotes, setIsSavingNotes] = useState(false);

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

    const filteredOrders = orders.filter(o => 
        viewMode === 'archived' ? o.is_archived === true : o.is_archived !== true
    );

    const toggleSelectAll = () => {
        if (selectedOrderIds.length === filteredOrders.length) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(filteredOrders.map(o => o.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedOrderIds(prev => 
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    const handleBatchAction = async (action) => {
        if (selectedOrderIds.length === 0) return;
        
        let confirmMsg = '';
        let updates = {};
        let isDelete = false;

        if (action === 'archive') {
            confirmMsg = `確定要將這 ${selectedOrderIds.length} 筆訂單移至垃圾桶嗎？`;
            updates = { is_archived: true };
        } else if (action === 'restore') {
            confirmMsg = `確定要將這 ${selectedOrderIds.length} 筆訂單還原嗎？`;
            updates = { is_archived: false };
        } else if (action === 'delete') {
            confirmMsg = `⚠️ 危險操作：確定要永久刪除這 ${selectedOrderIds.length} 筆訂單嗎？（刪除後無法復原）`;
            isDelete = true;
        }

        if (!confirm(confirmMsg)) return;

        setIsLoading(true);
        try {
            if (isDelete) {
                const { error } = await supabase.from('orders').delete().in('id', selectedOrderIds);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('orders').update(updates).in('id', selectedOrderIds);
                if (error) throw error;
            }
            setSelectedOrderIds([]);
            await fetchOrders();
            // Don't alert here to keep flow fast, just let UI reflex the removal
        } catch (error) {
            alert('批次操作失敗: ' + error.message);
            setIsLoading(false);
        }
    };

    const handleUpdateNotes = async () => {
        setIsSavingNotes(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ admin_notes: selectedOrder.admin_notes })
                .eq('id', selectedOrder.id);
            if (error) throw error;
            alert('備註更新成功！');
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, admin_notes: selectedOrder.admin_notes } : o));
        } catch(e) {
            alert('更新失敗: ' + e.message);
        } finally {
            setIsSavingNotes(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">訂單管理 (Orders)</h1>
                <Button onClick={fetchOrders} variant="outline">重整列表</Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button 
                    onClick={() => { setViewMode('active'); setSelectedOrderIds([]); }}
                    className={`pb-2 px-4 font-bold border-b-2 transition-colors ${viewMode === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    一般訂單 ({orders.filter(o => !o.is_archived).length})
                </button>
                <button 
                    onClick={() => { setViewMode('archived'); setSelectedOrderIds([]); }}
                    className={`pb-2 px-4 font-bold border-b-2 transition-colors flex items-center gap-1 ${viewMode === 'archived' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Archive size={16} /> 垃圾桶 ({orders.filter(o => o.is_archived).length})
                </button>
            </div>

            {/* Batch Actions Bar */}
            {selectedOrderIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-blue-800 font-bold ml-2">已選擇 {selectedOrderIds.length} 筆訂單</span>
                    <div className="flex gap-2">
                        {viewMode === 'active' ? (
                            <Button size="sm" onClick={() => handleBatchAction('archive')} className="bg-yellow-500 hover:bg-yellow-600 outline-none border-none text-white flex items-center gap-2">
                                <Archive size={16} /> 批次移至垃圾桶
                            </Button>
                        ) : (
                            <>
                                <Button size="sm" onClick={() => handleBatchAction('restore')} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                                    <RefreshCw size={16} /> 批次還原
                                </Button>
                                <Button size="sm" onClick={() => handleBatchAction('delete')} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2">
                                    <Trash2 size={16} /> 批次永久刪除
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm font-medium">
                        <tr>
                            <th className="p-4 w-12 text-center">
                                <input 
                                    type="checkbox" 
                                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 cursor-pointer rounded border-gray-300"
                                />
                            </th>
                            <th className="p-4">訂單編號 (ID)</th>
                            <th className="p-4">訂購日期</th>
                            <th className="p-4">客戶姓名</th>
                            <th className="p-4">總金額</th>
                            <th className="p-4">狀態 (點擊修改)</th>
                            <th className="p-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrders.map(order => (
                            <tr key={order.id} className={`transition-colors ${selectedOrderIds.includes(order.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                                <td className="p-4 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedOrderIds.includes(order.id)}
                                        onChange={() => toggleSelect(order.id)}
                                        className="w-4 h-4 cursor-pointer rounded border-gray-300"
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="font-mono font-bold text-gray-800">{order.order_id}</div>
                                    {order.admin_notes && (
                                        <div className="text-xs text-yellow-700 bg-yellow-100 rounded px-1.5 py-0.5 mt-1 max-w-[150px] truncate" title={order.admin_notes}>
                                            📝 {order.admin_notes}
                                        </div>
                                    )}
                                </td>
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
                                <td colSpan="7" className="p-8 text-center text-gray-400">目前沒有訂單資料</td>
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
                            
                            {/* Notes Info */}
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-yellow-800 flex items-center gap-2"><Edit size={16}/>內部備註 (僅管理員可見)</h4>
                                    <Button size="sm" onClick={handleUpdateNotes} disabled={isSavingNotes} className="bg-yellow-600 hover:bg-yellow-700 text-white h-8 border-none outline-none">
                                        {isSavingNotes ? '儲存中...' : '儲存備註'}
                                    </Button>
                                </div>
                                <textarea
                                    value={selectedOrder.admin_notes || ''}
                                    onChange={e => setSelectedOrder({...selectedOrder, admin_notes: e.target.value})}
                                    placeholder="標記測試單、異常原因、或任何備註事項... (可作為未來搜尋依據)"
                                    className="w-full p-2 border border-yellow-300 rounded focus:border-yellow-500 outline-none text-sm bg-yellow-50/50 min-h-[60px]"
                                />
                            </div>

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
