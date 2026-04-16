import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Upload, Loader2, Image } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
    fetchPortfolio,
    createPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem,
    uploadPortfolioImage,
} from '../../lib/forgeService';

const MATERIAL_OPTIONS = ['雷射切割', '3D列印', '複合'];

function getInitialForm() {
    return { title: '', description: '', image_url: '', material: '', tags: '', sort_order: 0 };
}

export const AdminForgePortfolio = () => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState(getInitialForm());
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    useEffect(() => { load(); }, []);

    async function load() {
        setIsLoading(true);
        try { setItems(await fetchPortfolio()); }
        catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    }

    function openCreate() {
        setIsEditMode(false);
        setEditId(null);
        setFormData(getInitialForm());
        setIsModalOpen(true);
    }

    function openEdit(item) {
        setIsEditMode(true);
        setEditId(item.id);
        setFormData({
            title: item.title || '',
            description: item.description || '',
            image_url: item.image_url || '',
            material: item.material || '',
            tags: (item.tags || []).join(', '),
            sort_order: item.sort_order ?? 0,
        });
        setIsModalOpen(true);
    }

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploadingImage(true);
        try {
            const url = await uploadPortfolioImage(file);
            setFormData(p => ({ ...p, image_url: url }));
        } catch (err) {
            alert('圖片上傳失敗：' + err.message);
        } finally {
            setIsUploadingImage(false);
        }
    }

    async function handleSave() {
        if (!formData.title.trim()) { alert('請填寫標題'); return; }
        if (!formData.image_url.trim()) { alert('請上傳或填寫圖片 URL'); return; }
        setIsSaving(true);
        try {
            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                image_url: formData.image_url.trim(),
                material: formData.material || null,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                sort_order: Number(formData.sort_order) || 0,
            };
            if (isEditMode) {
                await updatePortfolioItem(editId, payload);
            } else {
                await createPortfolioItem(payload);
            }
            setIsModalOpen(false);
            await load();
        } catch (err) {
            alert('儲存失敗：' + err.message);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(id, title) {
        if (!confirm(`確定刪除「${title}」？此操作無法復原。`)) return;
        try {
            await deletePortfolioItem(id);
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            alert('刪除失敗：' + err.message);
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">作品集管理</h1>
                    <p className="text-sm text-gray-500 mt-1">鍛造工坊前台展示的作品集圖片（排序數字越大越前面）</p>
                </div>
                <Button onClick={openCreate} className="flex items-center gap-2">
                    <Plus size={18} /> 新增作品
                </Button>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-forge-500" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <Image size={48} className="mx-auto mb-4 opacity-40" />
                    <p>尚無作品，點擊右上角新增。</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="group relative bg-gray-100 rounded-xl overflow-hidden aspect-square border border-gray-200">
                            <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => openEdit(item)}
                                        className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                                        title="編輯"
                                    >
                                        <Edit size={14} className="text-gray-700" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id, item.title)}
                                        className="p-1.5 bg-white/90 rounded-lg hover:bg-red-50 transition-colors"
                                        title="刪除"
                                    >
                                        <Trash2 size={14} className="text-red-600" />
                                    </button>
                                </div>
                                <div>
                                    <p className="text-white font-bold text-xs leading-snug">{item.title}</p>
                                    {item.material && (
                                        <span className="inline-block mt-1 bg-forge-500/80 text-white text-xs px-2 py-0.5 rounded-full">
                                            {item.material}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Sort order badge */}
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                #{item.sort_order}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-900">
                                {isEditMode ? '編輯作品' : '新增作品'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Image upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">作品圖片 *</label>
                                <div className="flex gap-3 items-start">
                                    <div className="w-24 h-24 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden flex-shrink-0">
                                        {formData.image_url ? (
                                            <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Image size={24} className="text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer bg-forge-50 hover:bg-forge-100 border border-forge-200 text-forge-700 font-medium text-sm px-4 py-2 rounded-lg transition-colors w-fit">
                                            {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            {isUploadingImage ? '上傳中...' : '上傳圖片'}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                                        </label>
                                        <Input
                                            placeholder="或直接貼上圖片 URL"
                                            value={formData.image_url}
                                            onChange={e => setFormData(p => ({ ...p, image_url: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">作品標題 *</label>
                                <Input
                                    placeholder="例如：壓克力 LED 燈罩"
                                    value={formData.title}
                                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">說明（選填）</label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none text-sm"
                                    placeholder="簡短說明材料、尺寸或製程細節"
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>

                            {/* Material */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">材料分類</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={formData.material}
                                    onChange={e => setFormData(p => ({ ...p, material: e.target.value }))}
                                >
                                    <option value="">未分類</option>
                                    {MATERIAL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">標籤（選填，逗號分隔）</label>
                                <Input
                                    placeholder="例如：客製, 禮品, 壓克力"
                                    value={formData.tags}
                                    onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
                                />
                            </div>

                            {/* Sort order */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">排序權重（數字越大越前面）</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={formData.sort_order}
                                    onChange={e => setFormData(p => ({ ...p, sort_order: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                            >
                                取消
                            </button>
                            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                                {isSaving && <Loader2 size={16} className="animate-spin" />}
                                {isSaving ? '儲存中...' : isEditMode ? '更新' : '新增'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
