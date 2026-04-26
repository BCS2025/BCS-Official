import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Search, Eye, X, ChevronDown, ChevronUp, Archive, RefreshCw, Trash2, Edit, Undo2, Printer, Truck } from 'lucide-react';
import { formatCurrency } from '../../lib/pricing';
import { refundLinePay, getPaymentMethodLabel, getPaymentStatusLabel } from '../../lib/paymentService';

const SHIPPING_LABELS = {
    store: '超商店到店',
    tcat: '黑貓宅配',
    post: '中華郵政',
    pickup: '自取',
};

const LOGISTICS_BRAND_LABELS = {
    UNIMARTC2C: '7-11 賣貨便',
    FAMIC2C: '全家店到店',
    HILIFEC2C: '萊爾富店到店',
    OKMARTC2C: 'OK 超商店到店',
    TCAT: '黑貓宅急便',
    POST: '中華郵政',
};

export const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [viewMode, setViewMode] = useState('active'); // 'active' | 'archived'
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [isRefunding, setIsRefunding] = useState(false);
    const [isPrintingLabel, setIsPrintingLabel] = useState(false);
    const [isRefreshingLogistics, setIsRefreshingLogistics] = useState(false);

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

        let updatedOrder = null;
        try {
            const { error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', orderId);

            if (error) throw error;

            // Refresh local state
            setOrders(prev => prev.map(o => {
                if (o.id !== orderId) return o;
                updatedOrder = { ...o, ...updates };
                return updatedOrder;
            }));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('更新失敗: ' + error.message);
            return;
        }

        // 確認入帳 (status='paid') 時觸發綠界建單。失敗只跳訊息，不影響狀態更新。
        if (newStatus === 'paid' && updatedOrder && !updatedOrder.logistics_id) {
            const subType = updatedOrder.logistics_sub_type || updatedOrder.cvs_store_brand;
            if (!subType) return; // 自取不建物流單
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const accessToken = sessionData?.session?.access_token;
                if (!accessToken) {
                    alert('已記為入帳，但 Session 過期無法建立物流單，請重新登入後到該訂單手動補建。');
                    return;
                }
                const res = await fetch('/api/logistics/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ orderId: updatedOrder.order_id }),
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                    alert(`已記為入帳，但綠界建單失敗：${json.error || res.status}\n\n（已寫入失敗記錄，可至「通知失敗」頁面或重試此訂單。）`);
                } else {
                    setOrders(prev => prev.map(o => o.id === orderId ? {
                        ...o,
                        logistics_id: json.logisticsId || o.logistics_id,
                    } : o));
                }
            } catch (err) {
                console.error('auto create logistics failed:', err);
                alert(`已記為入帳，但建單請求例外：${err.message}`);
            }
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

    const handleRefund = async (order) => {
        if (order.payment_method !== 'line_pay') return;
        if (order.payment_status !== 'paid') {
            alert('此訂單不在「已付款」狀態，無法退款。');
            return;
        }

        const input = prompt(
            `確定要對訂單 ${order.order_id} 執行 LINE Pay 退款嗎？\n\n` +
            `原訂單金額：$${order.total_amount}\n` +
            `留空 = 全額退款；或輸入要退款的金額（部分退款）：`,
            String(order.total_amount)
        );
        if (input === null) return;

        const trimmed = input.trim();
        const refundAmount = trimmed === '' ? null : Number(trimmed);
        if (refundAmount !== null && (!Number.isFinite(refundAmount) || refundAmount <= 0)) {
            alert('退款金額必須是正整數');
            return;
        }

        if (!confirm(`即將執行退款 $${refundAmount ?? order.total_amount}，確定嗎？此動作會呼叫 LINE Pay，無法撤銷。`)) {
            return;
        }

        setIsRefunding(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (!accessToken) throw new Error('尚未登入或 Session 已過期，請重新登入');

            const result = await refundLinePay({
                orderId: order.order_id,
                refundAmount,
                accessToken,
            });
            alert(`退款成功（${result.isFull ? '全額' : '部分'} $${result.refundAmount}）`);
            await fetchOrders();
            if (selectedOrder?.id === order.id) {
                setSelectedOrder(null);
            }
        } catch (err) {
            console.error('Refund failed:', err);
            alert(`退款失敗：${err.message}`);
        } finally {
            setIsRefunding(false);
        }
    };

    const handlePrintLabel = async (order) => {
        if (!order?.logistics_id) {
            alert('此訂單尚未建立綠界物流單，無法列印託運單。');
            return;
        }
        setIsPrintingLabel(true);
        let blobUrl = null;
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (!accessToken) throw new Error('Session 過期，請重新登入');

            const res = await fetch('/api/logistics/print-document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ orderId: order.order_id }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(text || `列印請求失敗 (${res.status})`);
            }
            const html = await res.text();
            const blob = new Blob([html], { type: 'text/html' });
            blobUrl = URL.createObjectURL(blob);
            const win = window.open(blobUrl, '_blank', 'width=900,height=700');
            if (!win) {
                throw new Error('無法開啟新視窗，請在瀏覽器允許彈出視窗。');
            }
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        } catch (err) {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            console.error('print label failed:', err);
            alert('列印失敗：' + err.message);
        } finally {
            setIsPrintingLabel(false);
        }
    };

    const handleRefreshLogistics = async (order) => {
        if (!order?.logistics_id) {
            alert('此訂單尚未建立綠界物流單。');
            return;
        }
        setIsRefreshingLogistics(true);
        try {
            const url = `/api/logistics/query-status?orderId=${encodeURIComponent(order.order_id)}&refresh=true`;
            const res = await fetch(url);
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `查詢失敗 (${res.status})`);
            const fresh = json.order || {};
            const patch = {
                logistics_status: fresh.logistics_status,
                logistics_status_at: fresh.logistics_status_at,
                logistics_message: fresh.logistics_message,
            };
            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...patch } : o));
            if (selectedOrder?.id === order.id) {
                setSelectedOrder(prev => prev ? { ...prev, ...patch } : prev);
            }
        } catch (err) {
            console.error('refresh logistics failed:', err);
            alert('刷新失敗：' + err.message);
        } finally {
            setIsRefreshingLogistics(false);
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
                                    {(order.logistics_sub_type || order.logistics_id) && (
                                        <div className="mt-1 text-[11px] text-gray-600 space-y-0.5 max-w-[180px]">
                                            <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 rounded px-1.5 py-0.5">
                                                <Truck size={11} />
                                                {LOGISTICS_BRAND_LABELS[order.logistics_sub_type] || order.logistics_sub_type || '—'}
                                            </div>
                                            {order.shipment_no && (
                                                <div className="font-mono truncate" title={order.shipment_no}>
                                                    #{order.shipment_no}
                                                </div>
                                            )}
                                            {order.logistics_message && (
                                                <div className="text-gray-500 truncate" title={order.logistics_message}>
                                                    {order.logistics_message}
                                                </div>
                                            )}
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

                            {/* Payment Info */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">💳 金流資訊</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <p><span className="text-gray-500">付款方式:</span> {getPaymentMethodLabel(selectedOrder.payment_method || 'bank_transfer')}</p>
                                    <p><span className="text-gray-500">付款狀態:</span> <span className="font-bold">{getPaymentStatusLabel(selectedOrder.payment_status || 'pending')}</span></p>
                                    {selectedOrder.payment_ref && (
                                        <p className="col-span-2"><span className="text-gray-500">LINE Pay 交易:</span> <span className="font-mono text-xs">{selectedOrder.payment_ref}</span></p>
                                    )}
                                    {selectedOrder.paid_at && (
                                        <p className="col-span-2"><span className="text-gray-500">付款時間:</span> {new Date(selectedOrder.paid_at).toLocaleString()}</p>
                                    )}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">👤 客戶資訊</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <p><span className="text-gray-500">姓名:</span> {selectedOrder.user_info?.name}</p>
                                    <p><span className="text-gray-500">電話:</span> {selectedOrder.user_info?.phone}</p>
                                    <p><span className="text-gray-500">Email:</span> {selectedOrder.user_info?.email}</p>
                                    <p>
                                        <span className="text-gray-500">寄送:</span>{' '}
                                        {SHIPPING_LABELS[selectedOrder.user_info?.shippingMethod] || selectedOrder.user_info?.shippingMethod || '—'}
                                    </p>
                                    {selectedOrder.user_info?.shippingMethod === 'pickup' && selectedOrder.user_info?.pickupLocation && (
                                        <p className="col-span-2 border-t border-gray-200 pt-2 mt-1">
                                            <span className="text-gray-500">自取門市:</span> {selectedOrder.user_info.pickupLocation}
                                            {selectedOrder.user_info.pickupTime && `（${selectedOrder.user_info.pickupTime}）`}
                                        </p>
                                    )}
                                    {selectedOrder.user_info?.address && (
                                        <p className="col-span-2 border-t border-gray-200 pt-2 mt-1">
                                            <span className="text-gray-500">地址:</span>
                                            {selectedOrder.user_info?.zipCode ? ` ${selectedOrder.user_info.zipCode} ` : ' '}
                                            {selectedOrder.user_info?.address}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Logistics Info */}
                            {(selectedOrder.logistics_sub_type || selectedOrder.logistics_id || selectedOrder.cvs_store_name) && (
                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-purple-800 flex items-center gap-2">
                                            <Truck size={16} /> 綠界物流
                                        </h4>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRefreshLogistics(selectedOrder)}
                                                disabled={isRefreshingLogistics || !selectedOrder.logistics_id}
                                                className="h-8 flex items-center gap-1"
                                            >
                                                <RefreshCw size={14} className={isRefreshingLogistics ? 'animate-spin' : ''} />
                                                {isRefreshingLogistics ? '查詢中…' : '強制刷新'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handlePrintLabel(selectedOrder)}
                                                disabled={isPrintingLabel || !selectedOrder.logistics_id}
                                                className="h-8 bg-purple-600 hover:bg-purple-700 text-white border-none flex items-center gap-1"
                                            >
                                                <Printer size={14} />
                                                {isPrintingLabel ? '產生中…' : '列印託運單'}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        <p>
                                            <span className="text-gray-500">物流方式:</span>{' '}
                                            {LOGISTICS_BRAND_LABELS[selectedOrder.logistics_sub_type] || selectedOrder.logistics_sub_type || '—'}
                                        </p>
                                        <p>
                                            <span className="text-gray-500">託運編號:</span>{' '}
                                            <span className="font-mono">{selectedOrder.shipment_no || selectedOrder.logistics_id || '—'}</span>
                                        </p>
                                        {selectedOrder.payment_no && (
                                            <p>
                                                <span className="text-gray-500">繳款代碼:</span>{' '}
                                                <span className="font-mono">{selectedOrder.payment_no}</span>
                                            </p>
                                        )}
                                        {selectedOrder.logistics_status && (
                                            <p>
                                                <span className="text-gray-500">狀態碼:</span>{' '}
                                                <span className="font-mono">{selectedOrder.logistics_status}</span>
                                            </p>
                                        )}
                                        {selectedOrder.cvs_store_name && (
                                            <p className="col-span-2">
                                                <span className="text-gray-500">取件門市:</span> {selectedOrder.cvs_store_name}
                                                {selectedOrder.cvs_store_address ? `（${selectedOrder.cvs_store_address}）` : ''}
                                            </p>
                                        )}
                                        {selectedOrder.logistics_message && (
                                            <p className="col-span-2">
                                                <span className="text-gray-500">最新訊息:</span> {selectedOrder.logistics_message}
                                                {selectedOrder.logistics_status_at && (
                                                    <span className="ml-2 text-xs text-gray-400">
                                                        {new Date(selectedOrder.logistics_status_at).toLocaleString()}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                        {!selectedOrder.logistics_id && (
                                            <p className="col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                                尚未建立綠界物流單。將狀態設為「已付款」會自動建立；或先確認訂單已付款後再操作。
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

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
                                                        if (key === 'proofFileLater') return null;
                                                        if (key.endsWith('_filename')) return null;
                                                        // 對應 _filename 存在 → 此 key 是檔案 URL，由下方檔案區塊處理
                                                        if (item[`${key}_filename`]) return null;
                                                        if (val === null || val === undefined || val === '') return null;
                                                        return (
                                                            <span key={key} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                                {key}: {String(val)}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                                {/* 通用化檔案連結：偵測所有 _filename 結尾的欄位 */}
                                                {Object.keys(item).filter(k => k.endsWith('_filename')).map(filenameKey => {
                                                    const fieldKey = filenameKey.replace(/_filename$/, '');
                                                    const url = item[fieldKey];
                                                    const filename = item[filenameKey];
                                                    if (!url || !filename) return null;
                                                    const ext = (filename.split('.').pop() || 'FILE').toUpperCase();
                                                    const isImage = /^(PNG|JPG|JPEG|GIF|WEBP|SVG)$/.test(ext);
                                                    return (
                                                        <div key={filenameKey} className="mt-2 space-y-1">
                                                            <a href={url} target="_blank" rel="noopener noreferrer"
                                                               className="text-xs text-blue-600 underline inline-flex items-center gap-1">
                                                                下載檔案：{filename}
                                                                <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded">{ext}</span>
                                                            </a>
                                                            {isImage && (
                                                                <img src={url} alt={filename} className="max-w-[120px] max-h-[120px] mt-1 border rounded" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {item.proofFileLater && (
                                                    <div className="mt-2 inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded">
                                                        ⚠️ 客戶選擇稍後上傳，待補件
                                                    </div>
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
                        <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center gap-2">
                            <div>
                                {selectedOrder.payment_method === 'line_pay' && selectedOrder.payment_status === 'paid' && (
                                    <Button
                                        onClick={() => handleRefund(selectedOrder)}
                                        disabled={isRefunding}
                                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                                    >
                                        <Undo2 size={16} />
                                        {isRefunding ? '退款中...' : 'LINE Pay 退款'}
                                    </Button>
                                )}
                            </div>
                            <Button onClick={() => setSelectedOrder(null)}>關閉</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
