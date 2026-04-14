import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Save, AlertTriangle, CheckCircle, RefreshCw, Plus, X, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminInventory = () => {
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [tempData, setTempData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    
    // Create Mode States
    const [isCreating, setIsCreating] = useState(false);
    const [newMaterial, setNewMaterial] = useState({ id: '', name: '', current_stock: 0, safety_stock: 0 });

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

    const handleCreate = async () => {
        if (!newMaterial.id || !newMaterial.name) {
            alert('「代號(ID)」與「原料名稱」必填！');
            return;
        }
        if (!newMaterial.id.match(/^[a-z0-9_]+$/)) {
            alert('代號 ID 只能包含小寫英文、數字與底線 (_)！');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('materials')
                .insert([
                    {
                        id: newMaterial.id,
                        name: newMaterial.name,
                        current_stock: parseInt(newMaterial.current_stock, 10) || 0,
                        safety_stock: parseInt(newMaterial.safety_stock, 10) || 0
                    }
                ]);

            if (error) throw error;

            setIsCreating(false);
            setNewMaterial({ id: '', name: '', current_stock: 0, safety_stock: 0 });
            alert('新增原料成功！');
            fetchMaterials();
        } catch (err) {
            console.error('Create failed:', err);
            alert('新增失敗: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">載入中...</div>;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">原料庫存管理</h1>
                <div className="flex gap-2">
                    <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
                        <Plus size={16} /> 新增原料
                    </Button>
                    <Button onClick={fetchMaterials} variant="outline" className="flex items-center gap-2">
                        <RefreshCw size={16} /> 重整列表
                    </Button>
                </div>
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
                        {isCreating && (
                            <tr className="bg-green-50 border-t-2 border-b-2 border-green-200">
                                <td className="p-4 space-y-2">
                                    <Input 
                                        placeholder="原料名稱 (中文，例: 木製底座)" 
                                        value={newMaterial.name} 
                                        onChange={e => setNewMaterial(p => ({ ...p, name: e.target.value }))}
                                        className="border-green-300"
                                    />
                                    <Input 
                                        placeholder="ID 代號 (英文，例: mat_base)" 
                                        value={newMaterial.id} 
                                        onChange={e => setNewMaterial(p => ({ ...p, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                                        className="font-mono text-xs border-green-300"
                                    />
                                </td>
                                <td className="p-4">
                                    <Input 
                                        type="number" 
                                        placeholder="目前庫存" 
                                        value={newMaterial.current_stock} 
                                        onChange={e => setNewMaterial(p => ({ ...p, current_stock: e.target.value }))}
                                        className="text-center font-mono border-green-300"
                                    />
                                </td>
                                <td className="p-4">
                                    <Input 
                                        type="number" 
                                        placeholder="安全庫存" 
                                        value={newMaterial.safety_stock} 
                                        onChange={e => setNewMaterial(p => ({ ...p, safety_stock: e.target.value }))}
                                        className="text-center font-mono border-green-300"
                                    />
                                </td>
                                <td className="p-4 text-center text-green-700 font-bold text-xs">
                                    【新增中...】
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)} disabled={isSaving}>
                                            取消
                                        </Button>
                                        <Button size="sm" onClick={handleCreate} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
                                            {isSaving ? '儲存中' : '儲存新增'}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        )}
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
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => startEdit(m)}>
                                                    編輯
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                                                    if(confirm(`確定要永久刪除原料「${m.name}」嗎？\n\n注意：如果已有「商品配方」正在使用此原料，為了保護資料完整性，系統將會拒絕刪除！`)) {
                                                        try {
                                                            const { error } = await supabase.from('materials').delete().eq('id', m.id);
                                                            if (error) throw error;
                                                            alert('✅ 刪除成功！');
                                                            fetchMaterials();
                                                        } catch (err) {
                                                            alert('❌ 刪除失敗：此原料可能正被某個商品的「扣除配方」使用中，請先去商品管理移除配方後再刪除。\n' + err.message);
                                                        }
                                                    }
                                                }}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
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
