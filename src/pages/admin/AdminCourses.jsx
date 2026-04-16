import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Upload, Users, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    uploadCourseImage,
} from '../../lib/courseService';
import { fetchLocations } from '../../lib/locationService';

const STATUS_LABELS = {
    open: { label: '開放報名', color: 'text-green-700 bg-green-50' },
    full: { label: '報名截止', color: 'text-gray-700 bg-gray-100' },
    closed: { label: '已結束', color: 'text-gray-500 bg-gray-100' },
};

function getInitialForm() {
    return {
        title: '',
        description: '',
        cover_url: '',
        gallery_urls: [],
        date: '',
        duration_min: 120,
        min_age: '',
        max_age: '',
        capacity: 10,
        enrolled: 0,
        price: 0,
        status: 'open',
        location_id: '',
    };
}

function formatLocalDatetime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const AdminCourses = () => {
    const [courses, setCourses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState(getInitialForm());
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [isUploadingGallery, setIsUploadingGallery] = useState(false);

    useEffect(() => { load(); }, []);

    async function load() {
        setIsLoading(true);
        try {
            const [c, l] = await Promise.all([fetchCourses(), fetchLocations()]);
            setCourses(c);
            setLocations(l);
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

    function handleOpenEdit(course) {
        const { location, ...rest } = course;
        setFormData({
            ...rest,
            date: formatLocalDatetime(course.date),
            gallery_urls: course.gallery_urls || [],
            min_age: course.min_age ?? '',
            max_age: course.max_age ?? '',
            location_id: course.location_id || '',
        });
        setIsEditMode(true);
        setEditId(course.id);
        setIsModalOpen(true);
    }

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    async function handleCoverUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploadingCover(true);
        try {
            const url = await uploadCourseImage(file);
            set('cover_url', url);
        } catch (err) {
            alert('封面上傳失敗：' + err.message);
        } finally {
            setIsUploadingCover(false);
        }
    }

    async function handleGalleryUpload(e) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        e.target.value = '';
        setIsUploadingGallery(true);
        try {
            const urls = [];
            for (const file of files) {
                try {
                    urls.push(await uploadCourseImage(file));
                } catch (err) {
                    alert(`「${file.name}」上傳失敗：${err.message}`);
                }
            }
            if (urls.length > 0) {
                set('gallery_urls', [...(formData.gallery_urls || []), ...urls]);
            }
        } finally {
            setIsUploadingGallery(false);
        }
    }

    function removeGalleryImage(idx) {
        set('gallery_urls', formData.gallery_urls.filter((_, i) => i !== idx));
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!formData.title || !formData.date) {
            alert('課程名稱與日期為必填');
            return;
        }
        setIsSaving(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                cover_url: formData.cover_url || null,
                gallery_urls: formData.gallery_urls || [],
                date: new Date(formData.date).toISOString(),
                duration_min: parseInt(formData.duration_min) || 120,
                min_age: formData.min_age !== '' ? parseInt(formData.min_age) : null,
                max_age: formData.max_age !== '' ? parseInt(formData.max_age) : null,
                capacity: parseInt(formData.capacity) || 10,
                price: parseInt(formData.price) || 0,
                status: formData.status,
                location_id: formData.location_id || null,
            };

            if (isEditMode) {
                await updateCourse(editId, payload);
            } else {
                await createCourse(payload);
            }

            setIsModalOpen(false);
            load();
        } catch (err) {
            alert('儲存失敗：' + err.message);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(course) {
        if (!confirm(`確定刪除「${course.title}」？\n此操作會同時刪除所有報名紀錄，無法復原！`)) return;
        try {
            await deleteCourse(course.id);
            load();
        } catch (err) {
            alert('刪除失敗：' + err.message);
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">課程管理 (Maker World)</h1>
                <Button onClick={handleOpenCreate} className="flex items-center gap-2">
                    <Plus size={16} /> 新增課程
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
                                    <th className="p-4">課程</th>
                                    <th className="p-4">日期</th>
                                    <th className="p-4">地點</th>
                                    <th className="p-4">報名 / 名額</th>
                                    <th className="p-4">狀態</th>
                                    <th className="p-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {courses.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400">尚無課程，點選右上角新增</td>
                                    </tr>
                                )}
                                {courses.map(c => {
                                    const st = STATUS_LABELS[c.status] || STATUS_LABELS.closed;
                                    return (
                                        <tr key={c.id} className="hover:bg-gray-50">
                                            <td className="p-4 flex items-center gap-3">
                                                <div className="w-16 h-12 bg-maker-50 rounded overflow-hidden flex-shrink-0">
                                                    {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{c.title}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {c.duration_min} 分鐘
                                                        {c.min_age && ` · ${c.min_age}${c.max_age ? `–${c.max_age}` : '+'}歲`}
                                                        {c.price > 0 ? ` · NT$${c.price}` : ' · 免費'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-700">
                                                {new Date(c.date).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4 text-sm text-gray-700">
                                                {c.location?.name ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin size={12} className="text-maker-500" />
                                                        {c.location.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">未設定</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Users size={14} className="text-maker-500" />
                                                    <span className="font-bold text-maker-700">{c.enrolled}</span>
                                                    <span className="text-gray-400">/ {c.capacity}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${st.color}`}>{st.label}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(c)}>
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(c)}>
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold">{isEditMode ? '編輯課程' : '新增課程'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {/* 基本資訊 */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">課程名稱 *</label>
                                <Input value={formData.title} onChange={e => set('title', e.target.value)} placeholder="例：Arduino 初學班" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">上課日期時間 *</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.date}
                                        onChange={e => set('date', e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-maker-500"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">課程時長（分鐘）</label>
                                    <Input type="number" value={formData.duration_min} onChange={e => set('duration_min', e.target.value)} min={30} />
                                </div>
                            </div>

                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                                <p className="text-xs text-amber-800 font-semibold">
                                    ⓘ 以下欄位僅供後台追蹤，<strong className="underline">不會顯示於公開前台</strong>。
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700">名額上限</label>
                                        <Input type="number" value={formData.capacity} onChange={e => set('capacity', e.target.value)} min={1} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700">費用（NT$）</label>
                                        <Input type="number" value={formData.price} onChange={e => set('price', e.target.value)} min={0} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700">課程狀態</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => set('status', e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-maker-500"
                                        >
                                            <option value="open">開放報名</option>
                                            <option value="full">報名截止</option>
                                            <option value="closed">已結束</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">最小年齡（歲）</label>
                                    <Input type="number" value={formData.min_age} onChange={e => set('min_age', e.target.value)} placeholder="不限" min={0} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">最大年齡（歲）</label>
                                    <Input type="number" value={formData.max_age} onChange={e => set('max_age', e.target.value)} placeholder="不限" min={0} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">上課地點</label>
                                <select
                                    value={formData.location_id || ''}
                                    onChange={e => set('location_id', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-maker-500"
                                >
                                    <option value="">— 未設定 —</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name}{loc.is_active ? '' : '（已停用）'}
                                        </option>
                                    ))}
                                </select>
                                {locations.length === 0 && (
                                    <p className="text-xs text-amber-600">尚無地點，請先至「上課地點管理」新增。</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">課程說明</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => set('description', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-maker-500 h-28 resize-none"
                                    placeholder="課程介紹、注意事項..."
                                />
                            </div>

                            {/* 封面圖 */}
                            <div className="space-y-2 border-t pt-5">
                                <label className="text-sm font-bold text-gray-700">封面圖</label>
                                <div className="flex items-center gap-4">
                                    {formData.cover_url && (
                                        <img src={formData.cover_url} alt="封面" className="w-24 h-16 object-cover rounded-lg border" />
                                    )}
                                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                                        <Upload size={16} />
                                        {isUploadingCover ? '上傳中...' : '上傳封面'}
                                        <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={isUploadingCover} />
                                    </label>
                                    {formData.cover_url && (
                                        <button type="button" onClick={() => set('cover_url', '')} className="text-xs text-red-500 hover:underline">移除</button>
                                    )}
                                </div>
                            </div>

                            {/* 課堂照片 Gallery */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">
                                    課堂照片 Gallery
                                    <span className="ml-2 text-xs font-normal text-gray-400">（可一次選多張）</span>
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {(formData.gallery_urls || []).map((url, idx) => (
                                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeGalleryImage(idx)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="w-20 h-20 border border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400 text-xs gap-1">
                                        <Upload size={18} />
                                        {isUploadingGallery ? '上傳中' : '新增'}
                                        <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" disabled={isUploadingGallery} />
                                    </label>
                                </div>
                            </div>

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
