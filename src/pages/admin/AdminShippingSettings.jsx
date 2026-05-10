import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { fetchAllShippingMethods } from '../../lib/shippingService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, RefreshCw, Truck } from 'lucide-react';

export const AdminShippingSettings = () => {
    const [methods, setMethods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingIds, setSavingIds] = useState(new Set());
    const [dirtyIds, setDirtyIds] = useState(new Set());

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setIsLoading(true);
        try {
            const list = await fetchAllShippingMethods();
            setMethods(list);
            setDirtyIds(new Set());
        } catch (err) {
            console.error(err);
            alert('載入物流設定失敗：' + err.message);
        } finally {
            setIsLoading(false);
        }
    }

    function patchMethod(id, patch) {
        setMethods(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
        setDirtyIds(prev => new Set(prev).add(id));
    }

    async function saveOne(id) {
        const m = methods.find(x => x.id === id);
        if (!m) return;
        setSavingIds(prev => new Set(prev).add(id));
        try {
            const payload = {
                name: m.name,
                description: m.description,
                icon: m.icon,
                price: parseInt(m.price, 10) || 0,
                free_shipping_threshold: m.free_shipping_threshold === '' || m.free_shipping_threshold == null
                    ? null
                    : parseInt(m.free_shipping_threshold, 10),
                is_active: !!m.is_active,
                sort_order: parseInt(m.sort_order, 10) || 0,
            };
            const { error } = await supabase.from('shipping_methods').update(payload).eq('id', id);
            if (error) throw error;
            setDirtyIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (err) {
            alert('儲存失敗：' + err.message);
        } finally {
            setSavingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }

    if (isLoading) {
        return <div className="p-10 text-center text-gray-500">載入中...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Truck className="text-blue-600" size={28} />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">運費與物流設定</h1>
                        <p className="text-sm text-gray-500 mt-1">調整每種物流的運費、滿額免運門檻、上下架狀態。前台結帳會即時套用。</p>
                    </div>
                </div>
                <Button variant="outline" onClick={load} className="flex items-center gap-2">
                    <RefreshCw size={16} /> 重新整理
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="p-3">物流類型</th>
                                <th className="p-3">顯示名稱</th>
                                <th className="p-3 w-28">運費 (NT$)</th>
                                <th className="p-3 w-36">免運門檻</th>
                                <th className="p-3 w-20">啟用</th>
                                <th className="p-3 w-24">排序</th>
                                <th className="p-3 w-28 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {methods.map(m => {
                                const isDirty = dirtyIds.has(m.id);
                                const isSaving = savingIds.has(m.id);
                                return (
                                    <tr key={m.id} className={isDirty ? 'bg-yellow-50' : ''}>
                                        <td className="p-3 align-top">
                                            <div className="font-mono text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded inline-block">
                                                {m.id}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">icon: {m.icon || '-'}</div>
                                        </td>
                                        <td className="p-3 align-top">
                                            <Input
                                                value={m.name || ''}
                                                onChange={e => patchMethod(m.id, { name: e.target.value })}
                                                className="mb-1"
                                            />
                                            <textarea
                                                value={m.description || ''}
                                                onChange={e => patchMethod(m.id, { description: e.target.value })}
                                                placeholder="描述（前台顯示）"
                                                className="w-full text-xs p-2 border rounded h-12 resize-none"
                                            />
                                        </td>
                                        <td className="p-3 align-top">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={m.price ?? 0}
                                                onChange={e => patchMethod(m.id, { price: e.target.value })}
                                            />
                                        </td>
                                        <td className="p-3 align-top">
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="留空 = 無免運"
                                                value={m.free_shipping_threshold ?? ''}
                                                onChange={e => patchMethod(m.id, {
                                                    free_shipping_threshold: e.target.value === '' ? null : e.target.value
                                                })}
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1">留空表示此物流不適用免運</p>
                                        </td>
                                        <td className="p-3 align-top">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!m.is_active}
                                                    onChange={e => patchMethod(m.id, { is_active: e.target.checked })}
                                                    className="w-4 h-4"
                                                />
                                                <span className={`text-xs font-bold ${m.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {m.is_active ? '啟用' : '停用'}
                                                </span>
                                            </label>
                                        </td>
                                        <td className="p-3 align-top">
                                            <Input
                                                type="number"
                                                value={m.sort_order ?? 0}
                                                onChange={e => patchMethod(m.id, { sort_order: e.target.value })}
                                            />
                                        </td>
                                        <td className="p-3 align-top text-right">
                                            <Button
                                                size="sm"
                                                onClick={() => saveOne(m.id)}
                                                disabled={!isDirty || isSaving}
                                                className="flex items-center gap-1 ml-auto"
                                            >
                                                <Save size={14} /> {isSaving ? '儲存中' : '儲存'}
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p>• 運費調整後，購物車會在重新進入時套用新值。</p>
                <p>• 免運門檻可逐個物流獨立設定（如：店到店滿 599、宅配滿 1500、自取永遠免運）。</p>
                <p>• 停用某種物流會立即從前台結帳頁隱藏，不影響歷史訂單。</p>
            </div>
        </div>
    );
};
