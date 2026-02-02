import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Save, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminInventory = () => {
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [tempData, setTempData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchMaterials();
    }, []);

    async function fetchMaterials() {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error loading materials:', error);
            alert('讀取原料失敗');
        } else {
            setMaterials(data);
        }
        setIsLoading(false);
    }

    const startEdit = (material) => {
        setEditingId(material.id);
        setTempData({
            current_stock: material.current_stock,
            safety_stock: material.safety_stock
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTempData({});
    };

    const saveEdit = async (id) => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('materials')
                .update({
                    current_stock: parseInt(tempData.current_stock, 10),
                    safety_stock: parseInt(tempData.safety_stock, 10)
                })
                .eq('id', id);

            if (error) throw error;

            // Optimistic Update
            setMaterials(prev => prev.map(m =>
                m.id === id ? { ...m, ...tempData } : m
            ));
            setEditingId(null);
        } catch (err) {
            console.error('Update failed:', err);
            alert('更新失敗: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setTempData(prev => ({ ...prev, [field]: value }));
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">載入中...</div>;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">原料庫存管理</h1>
                <Button onClick={fetchMaterials} variant="outline" className="flex items-center gap-2">
                    <RefreshCw size={16} /> 重整列表
                </Button>
                <Button onClick={async () => {
                    const GAS_URL = 'https://script.google.com/macros/s/AKfycbyO90PCWLiKQHvCn_tuBTHL4X-SdGYutHnepLKPLzKudSXP6A0E8Jix8MKKL_syyuGw/exec';
                    try {
                        alert('正在測試檢測庫存...');
                        const { data: criticalMaterials, error: rpcError } = await supabase.rpc('check_low_stock');

                        if (rpcError) {
                            console.error("RPC Error:", rpcError);
                            alert('RPC 錯誤: ' + rpcError.message);
                            return;
                        }

                        if (!criticalMaterials || criticalMaterials.length === 0) {
                            alert('沒有偵測到低於安全水位的原料 (所以不會發送通知)');
                            return;
                        }

                        // Copy logic from App.jsx
                        const outOfStock = criticalMaterials.filter(m => m.current_stock <= 0);
                        const lowStock = criticalMaterials.filter(m => m.current_stock > 0);

                        let alertMessage = `⚠️ 庫存警報通知 (測試)\n`;
                        if (outOfStock.length > 0) alertMessage += `\n⛔ 庫存用罄:\n${outOfStock.map(m => `- ${m.name}: ${m.current_stock}`).join('\n')}\n`;
                        if (lowStock.length > 0) alertMessage += `\n⚠️ 庫存告急:\n${lowStock.map(m => `- ${m.name}: ${m.current_stock}`).join('\n')}`;

                        alert(`偵測到 ${criticalMaterials.length} 項告急原料。正在發送 GAS 通知...\n\n內容預覽:\n${alertMessage}`);

                        await fetch(GAS_URL, {
                            method: 'POST',
                            mode: 'no-cors', // Important: won't allow reading response
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'system_alert',
                                message: alertMessage
                            })
                        });

                        alert('已發送請求給 GAS (請檢查手機是否收到)');

                    } catch (e) {
                        console.error(e);
                        alert('發生錯誤: ' + e.message);
                    }
                }} variant="destructive" className="flex items-center gap-2 ml-2">
                    <AlertTriangle size={16} /> 測試告急通知
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                        <tr>
                            <th className="p-4">原料名稱 (ID)</th>
                            <th className="p-4 text-center">目前庫存</th>
                            <th className="p-4 text-center">安全庫存詳定</th>
                            <th className="p-4 text-center">狀態</th>
                            <th className="p-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {materials.map((m) => {
                            const isEditing = editingId === m.id;
                            const isLowStock = m.current_stock <= m.safety_stock;

                            return (
                                <tr key={m.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{m.name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{m.id}</div>
                                    </td>
                                    <td className="p-4 text-center w-32">
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={tempData.current_stock}
                                                onChange={(e) => handleChange('current_stock', e.target.value)}
                                                className="text-center font-mono"
                                            />
                                        ) : (
                                            <span className={`font-mono text-lg ${isLowStock ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                                                {m.current_stock}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center w-32">
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={tempData.safety_stock}
                                                onChange={(e) => handleChange('safety_stock', e.target.value)}
                                                className="text-center font-mono"
                                            />
                                        ) : (
                                            <span className="font-mono text-gray-500">
                                                {m.safety_stock}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {isLowStock ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                                <AlertTriangle size={12} /> 庫存告急
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                <CheckCircle size={12} /> 充足
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={isSaving}>取消</Button>
                                                <Button size="sm" onClick={() => saveEdit(m.id)} disabled={isSaving}>
                                                    {isSaving ? '儲存中...' : <Save size={16} />}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => startEdit(m)}>
                                                編輯
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
