import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Upload, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    uploadLocationImage,
    LOCATION_TYPE_META,
    LOCATION_TYPE_OPTIONS,
} from '../../lib/locationService';

function getInitialForm() {
    return {
        name: '',
        type: 'partner',
        address: '',
        map_url: '',
        description: '',
        cover_url: '',
        is_active: true,
        sort_order: 0,
    };
}

export const AdminLocations = () => {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState(getInitialForm());
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => { load(); }, []);

    async function load() {
        setIsLoading(true);
        try {
            setLocations(await fetchLocations());
        } catch (e) {
            alert('載入失敗：' + e.message);
        } finally {
            setIsLoading(false);
        }
    }

    function handleOpenCreate() {
        setFormData(getInitialForm());
        setIsEditMode(false);
        setEditId(null);
        setIsModalOpen(true);
    }

    function handleOpenEdit(loc) {
        setFormData({
            name: loc.name || '',
            type: loc.type || 'partner',
            address: loc.address || '',
            map_url: loc.map_url || '',
            description: loc.description || '',
            cover_url: loc.cover_url || '',
            is_active: loc.is_active ?? true,
            sort_order: loc.sort_order ?? 0,
        });
        setIsEditMode(true);
        setEditId(loc.id);
        setIsModalOpen(true);
    }

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    async function handleCoverUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadLocationImage(file);
            set('cover_url', url);
        } catch (err) {
            alert('圖片上傳失敗：' + err.message);
        } finally {
            setIsUploading(false);
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('地點名稱為必填');
            return;
        }
        setIsSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                type: formData.type,
                address: formData.address.trim() || null,
                map_url: formData.map_url.trim() || null,
                description: formData.description.trim() || null,
                cover_url: formData.cover_url || null,
                is_active: formData.is_active,
                sort_order: parseInt(formData.sort_order) || 0,
            };
            if (isEditMode) {
                await updateLocation(editId, payload);
            } else {
                await createLocation(payload);
            }
            setIsModalOpen(false);
            load();
        } catch (err) {
            alert('儲存失敗：' + err.message);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(loc) {
        if (!confirm(`確定刪除「${loc.name}」？\n使用此地點的課程將顯示為「地點未設定」。`)) return;
        try {
            await deleteLocation(loc.id);
            load();
        } catch (err) {
            alert('刪除失敗：' + err.message);
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">上課地點管理</h1>
                    <p className="text-sm text-gray-500 mt-1">管理創客世界課程可用的所有上課地點（工作室、合作單位、圖書館等）</p>
                </div>
                <Button onClick={handleOpenCreate} className="flex items-center gap-2 bg-maker-500 hover:bg-maker-700">
                    <Plus size={16} /> 新增地點
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-400">載入中...</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 border-b text-sm">
                                <tr>
                                    <th className="p-4">地點</th>
                                    <th className="p-4">類別</th>
                                    <th className="p-4">地址</th>
                                    <th className="p-4">狀態 / 排序</th>
                                    <th className="p-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {locations.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400">
                                            尚無地點，點選右上角新增
                                        </td>
                                    </tr>
                                )}
                                {locations.map(loc => {
                                    const meta = LOCATION_TYPE_META[loc.type] || LOCATION_TYPE_META.other;
                                    return (
                                        <tr key={loc.id} className="hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                        {loc.cover_url
                                                            ? <img src={loc.cover_url} alt="" className="w-full h-full object-cover" />
                                                            : <MapPin size={18} className="text-gray-400" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{loc.name}</div>
                                                        {loc.description && (
                                                            <div className="text-xs text-gray-400 line-clamp-1 max-w-xs">{loc.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${meta.bg} ${meta.text}`}>
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {loc.address || <span className="text-gray-300">—</span>}
                                                {loc.map_url && (
                                                    <a href={loc.map_url} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-xs text-maker-500 hover:underline">
                                                        <ExternalLink size={11} /> 地圖
                                                    </a>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <div className={loc.is_active ? 'text-green-700' : 'text-gray-400'}>
                                                    {loc.is_active ? '啟用中' : '已停用'}
                                                </div>
                                                <div className="text-xs text-gray-400">排序：{loc.sort_order}</div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(loc)}>
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(loc)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold">{isEditMode ? '編輯地點' : '新增地點'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">地點名稱 *</label>
                                <Input value={formData.name} onChange={e => set('name', e.target.value)} placeholder="例：珍優英文家教班" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">類別</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => set('type', e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-maker-500"
                                    >
                                        {LOCATION_TYPE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">前台排序（數字大越前）</label>
                                    <Input type="number" value={formData.sort_order} onChange={e => set('sort_order', e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">地址</label>
                                <Input value={formData.address} onChange={e => set('address', e.target.value)} placeholder="台南市永康區..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">地圖連結（Google Maps URL，可選）</label>
                                <Input value={formData.map_url} onChange={e => set('map_url', e.target.value)} placeholder="https://maps.google.com/..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">簡介</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => set('description', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-maker-500 h-20 resize-none"
                                    placeholder="這個地點的環境、特色、合作說明..."
                                />
                            </div>

                            <div className="space-y-2 border-t pt-5">
                                <label className="text-sm font-bold text-gray-700">代表圖</label>
                                <div className="flex items-center gap-4">
                                    {formData.cover_url && (
                                        <img src={formData.cover_url} alt="" className="w-24 h-16 object-cover rounded-lg border" />
                                    )}
                                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                                        <Upload size={16} />
                                        {isUploading ? '上傳中...' : '上傳圖片'}
                                        <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={isUploading} />
                                    </label>
                                    {formData.cover_url && (
                                        <button type="button" onClick={() => set('cover_url', '')} className="text-xs text-red-500 hover:underline">移除</button>
                                    )}
                                </div>
                            </div>

                            <label className="flex items-center gap-2 pt-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={e => set('is_active', e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-700">啟用中（會顯示在前台地點介紹區）</span>
                            </label>

                            <div className="pt-4 border-t flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
                                <Button type="submit" disabled={isSaving} className="bg-maker-500 hover:bg-maker-700">
                                    {isSaving ? '儲存中...' : '儲存'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
