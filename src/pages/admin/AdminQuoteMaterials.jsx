import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Trash2, Edit, X, Save, AlertCircle } from 'lucide-react';
import { getQuoteMaterials, createQuoteMaterial, updateQuoteMaterial, deleteQuoteMaterial } from '../../lib/quoteService';

export const AdminQuoteMaterials = () => {
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        id: null,
        method: 'laser',
        name: '',
        sort_order: 10,
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await getQuoteMaterials();
            setMaterials(data || []);
            setErrorMsg('');
        } catch (err) {
            console.error('Failed to load quote materials:', err);
            setErrorMsg('讀取材質列表失敗，請確認資料表/權限是否設定正確。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setFormData({
            id: null,
            method: 'laser',
            name: '',
            sort_order: 10,
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (material) => {
        setFormData({
            id: material.id,
            method: material.method,
            name: material.name,
            sort_order: material.sort_order,
            is_active: material.is_active
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('確定要刪除這個選項嗎？這會立刻從報價表單中移除。')) return;
        
        try {
            await deleteQuoteMaterial(id);
            await loadData();
        } catch (err) {
            console.error("Delete failed:", err);
            alert('刪除失敗！');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            alert('請輸入名稱');
            return;
        }

        setIsSaving(true);
        try {
            if (formData.id) {
                // Update
                const updates = { ...formData };
                delete updates.id; // don't update PK
                await updateQuoteMaterial(formData.id, updates);
            } else {
                // Create
                const newRecord = { ...formData };
                delete newRecord.id; 
                await createQuoteMaterial(newRecord);
            }
            
            setIsModalOpen(false);
            await loadData();
        } catch (err) {
            console.error("Save failed:", err);
            alert('儲存失敗：' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">載入中...</div>;

    const laserMaterials = materials.filter(m => m.method === 'laser');
    const printMaterials = materials.filter(m => m.method === '3dprint');

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">報價材質管理 (Quote Materials)</h1>
                <Button onClick={handleOpenCreate} className="flex items-center gap-2">
                    <Plus size={16} /> 新增材質選項
                </Button>
            </div>

            {errorMsg && (
                <div className="mb-6 bg-red-50 p-4 rounded border border-red-200 text-red-700 flex items-center gap-2 font-bold">
                    <AlertCircle size={20}/>
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Laser Group */}
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <div className="bg-amber-50 px-4 py-3 border-b flex justify-between items-center">
                        <h2 className="font-bold text-amber-900">雷射 / 雕刻 (Laser)</h2>
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded font-bold">{laserMaterials.length}</span>
                    </div>
                    <ul className="divide-y divide-gray-100 p-2">
                        {laserMaterials.map(m => (
                            <li key={m.id} className="p-3 flex justify-between items-center hover:bg-gray-50 rounded">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    <span className={`font-medium ${m.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{m.name}</span>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">序:{m.sort_order}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenEdit(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                </div>
                            </li>
                        ))}
                        {laserMaterials.length === 0 && <li className="p-4 text-center text-gray-400 text-sm">無資料</li>}
                    </ul>
                </div>

                {/* 3D Print Group */}
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <div className="bg-blue-50 px-4 py-3 border-b flex justify-between items-center">
                        <h2 className="font-bold text-blue-900">FDM 3D 列印</h2>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded font-bold">{printMaterials.length}</span>
                    </div>
                    <ul className="divide-y divide-gray-100 p-2">
                        {printMaterials.map(m => (
                            <li key={m.id} className="p-3 flex justify-between items-center hover:bg-gray-50 rounded">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    <span className={`font-medium ${m.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{m.name}</span>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">序:{m.sort_order}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenEdit(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                </div>
                            </li>
                        ))}
                        {printMaterials.length === 0 && <li className="p-4 text-center text-gray-400 text-sm">無資料</li>}
                    </ul>
                </div>
            </div>

            {/* Editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold">{formData.id ? '編輯選項' : '新增材質選項'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-black"/></button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold">評估加工類型</label>
                                <select 
                                    className="w-full border rounded p-3 bg-gray-50"
                                    value={formData.method}
                                    onChange={e => setFormData(prev => ({...prev, method: e.target.value}))}
                                >
                                    <option value="laser">雷射 / 雕刻 (Laser)</option>
                                    <option value="3dprint">FDM 3D 列印 (3D Print)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold">材質顯示名稱 (會直接顯示在前台下拉選單)</label>
                                <Input 
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
                                    placeholder="例：夾板 (Plywood) 3mm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">排序 (數值大在最上面)</label>
                                    <Input 
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={e => setFormData(prev => ({...prev, sort_order: parseInt(e.target.value) || 0}))}
                                    />
                                </div>
                                <div className="flex items-center pt-8 gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="qa_active" 
                                        className="w-5 h-5"
                                        checked={formData.is_active}
                                        onChange={e => setFormData(prev => ({...prev, is_active: e.target.checked}))}
                                    />
                                    <label htmlFor="qa_active" className="font-bold cursor-pointer">啟用顯示</label>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? '儲存中...' : '儲存選項'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
