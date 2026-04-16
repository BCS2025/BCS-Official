import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const CONTEXT_LABELS = {
    order_notify: '訂單通知',
    custom_quote: '報價通知',
    registration: '報名通知',
    webhook: 'Webhook',
};

function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export const AdminNotificationFailures = () => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => { load(); }, []);

    async function load() {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('notification_failures')
                .select('*')
                .order('failed_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            setItems(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('確定標記此筆為已處理並刪除？')) return;
        setDeletingId(id);
        try {
            const { error } = await supabase.from('notification_failures').delete().eq('id', id);
            if (error) throw error;
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (e) {
            alert('刪除失敗：' + e.message);
        } finally {
            setDeletingId(null);
        }
    }

    async function handleDeleteAll() {
        if (!confirm(`確定清除全部 ${items.length} 筆失敗記錄？`)) return;
        try {
            const ids = items.map(i => i.id);
            const { error } = await supabase.from('notification_failures').delete().in('id', ids);
            if (error) throw error;
            setItems([]);
        } catch (e) {
            alert('清除失敗：' + e.message);
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle size={22} className="text-amber-500" />
                        通知失敗記錄
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        GAS Webhook 重試失敗後的 fallback 記錄，確認後手動補送並刪除。
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={load}
                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                        <RefreshCw size={15} /> 重新整理
                    </button>
                    {items.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                        >
                            <Trash2 size={15} /> 全部清除
                        </button>
                    )}
                </div>
            </div>

            {/* Stats banner */}
            {!isLoading && (
                <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${items.length === 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-amber-50 border border-amber-200'}`}>
                    {items.length === 0 ? (
                        <>
                            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                            <p className="text-sm text-green-800 font-medium">目前無失敗通知，所有 Webhook 運作正常。</p>
                        </>
                    ) : (
                        <>
                            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
                            <p className="text-sm text-amber-900 font-medium">
                                共有 <span className="font-black">{items.length}</span> 筆通知失敗記錄，請確認後手動補送。
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-amber-500" />
                </div>
            )}

            {/* List */}
            {!isLoading && items.length > 0 && (
                <div className="space-y-3">
                    {items.map(item => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            {/* Row */}
                            <div className="flex items-center justify-between p-4 gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">
                                        {CONTEXT_LABELS[item.context] || item.context}
                                    </span>
                                    <span className="text-sm text-gray-500 flex-shrink-0">
                                        {formatDate(item.failed_at)}
                                    </span>
                                    <span className="text-sm text-gray-400 truncate">
                                        {item.payload && typeof item.payload === 'object'
                                            ? (item.payload.customerName || item.payload.parentName || item.payload.orderId || JSON.stringify(item.payload).slice(0, 60) + '...')
                                            : String(item.payload || '').slice(0, 60)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                                    >
                                        {expandedId === item.id ? '收起' : '展開 payload'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deletingId === item.id}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="標記已處理並刪除"
                                    >
                                        {deletingId === item.id
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : <CheckCircle size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Payload detail */}
                            {expandedId === item.id && (
                                <div className="border-t border-gray-100 bg-gray-50 p-4">
                                    <p className="text-xs text-gray-500 mb-2 font-mono font-bold">PAYLOAD</p>
                                    <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all bg-white border border-gray-200 rounded-lg p-3">
                                        {JSON.stringify(item.payload, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
