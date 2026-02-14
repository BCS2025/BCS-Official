import { useState, useEffect } from 'react';
import { couponService, generateRandomCode } from '../../lib/couponService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Trash2, Edit, RefreshCw, X, Save, Copy } from 'lucide-react';
import { fetchProducts } from '../../lib/productService'; // For product selection

export const AdminCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [products, setProducts] = useState([]); // For product specific discounts
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState(getInitialForm());

    function getInitialForm() {
        return {
            code: '',
            discount_type: 'percentage', // percentage, fixed_amount, free_shipping
            value: 0,
            min_spend: 0,
            target_type: 'all', // all, product_specific
            target_product_ids: [],
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            usage_limit: '',
            is_active: true
        };
    }

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [cData, pData] = await Promise.all([
                couponService.getAll(),
                fetchProducts()
            ]);
            setCoupons(cData || []);
            setProducts(pData || []);
        } catch (error) {
            console.error(error);
            alert('載入失敗');
        } finally {
            setIsLoading(false);
        }
    }

    const handleOpenCreate = () => {
        setFormData(getInitialForm());
        setIsModalOpen(true);
    };

    const handleOpenEdit = (coupon) => {
        setFormData({
            ...coupon,
            start_date: coupon.start_date?.split('T')[0] || '',
            end_date: coupon.end_date?.split('T')[0] || '',
            // Ensure nulls are empty strings for inputs
            usage_limit: coupon.usage_limit === null ? '' : coupon.usage_limit,
            target_product_ids: coupon.target_product_ids || []
        });
        setIsModalOpen(true);
    };

    const handleGenerateCode = () => {
        setFormData(prev => ({ ...prev, code: generateRandomCode() }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                code: formData.code.toUpperCase(), // Force Uppercase
                value: parseFloat(formData.value) || 0,
                min_spend: parseFloat(formData.min_spend) || 0,
                usage_limit: formData.usage_limit === '' ? null : parseInt(formData.usage_limit),
                end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
                target_product_ids: formData.target_type === 'product_specific' ? formData.target_product_ids : []
            };

            // Check if editing (exists in list?) -> Actually Supabase upsert requires PK
            // But we can't change PK (code) easily. If creating, prevent dupes or warn?
            // "upsert" works.

            await couponService.create(payload); // UPSERT logic in 'create' uses 'insert' ? upsert might be better
            // Wait, create uses insert. Let's switch to upsert in service or handle here.
            // Actually service.create uses insert. Upsert is safer for "Create or Edit".
            // Let's assume we use upsert for simplicity in this MVP, 
            // BUT: modifying 'code' means creating new record. 
            // Editing existing code: We treat 'code' as ID. So regular upsert works if code matches.

            // To be safe, let's call upsert in service if we want to support edit.
            // Let's modify service usage:
            const { error: upsertError } = await import('../../lib/supabaseClient').then(m =>
                m.supabase.from('coupons').upsert(payload)
            );
            if (upsertError) throw upsertError;

            alert('儲存成功');
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            alert('儲存失敗: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (code) => {
        if (!confirm('確定要刪除此優惠券嗎？')) return;
        try {
            await couponService.delete(code);
            loadData();
        } catch (error) {
            alert('刪除失敗');
        }
    };

    // Helper for Product Selection
    const toggleProductSelect = (productId) => {
        const current = formData.target_product_ids;
        if (current.includes(productId)) {
            setFormData(prev => ({ ...prev, target_product_ids: current.filter(id => id !== productId) }));
        } else {
            setFormData(prev => ({ ...prev, target_product_ids: [...current, productId] }));
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">優惠券管理 (Coupons)</h1>
                <Button onClick={handleOpenCreate} className="flex items-center gap-2">
                    <Plus size={16} /> 新增優惠券
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                        <tr>
                            <th className="p-4">代碼 (Code)</th>
                            <th className="p-4">類型</th>
                            <th className="p-4">內容 (Value)</th>
                            <th className="p-4">門檻/限制</th>
                            <th className="p-4">狀態</th>
                            <th className="p-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {coupons.map(coupon => (
                            <tr key={coupon.code} className="hover:bg-gray-50">
                                <td className="p-4 font-mono font-bold text-blue-600">{coupon.code}</td>
                                <td className="p-4 text-sm">
                                    {coupon.discount_type === 'percentage' && '打折 (%)'}
                                    {coupon.discount_type === 'fixed_amount' && '折抵 ($)'}
                                    {coupon.discount_type === 'free_shipping' && '免運費'}
                                </td>
                                <td className="p-4 font-bold">
                                    {coupon.discount_type === 'percentage' ? `${coupon.value}% OFF` :
                                        coupon.discount_type === 'fixed_amount' ? `-$${coupon.value}` : 'Free Ship'}
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    <div>低消: ${coupon.min_spend}</div>
                                    <div>已用: {coupon.used_count} / {coupon.usage_limit || '∞'}</div>
                                    <div className="text-xs">
                                        {coupon.start_date?.split('T')[0]} ~ {coupon.end_date?.split('T')[0] || '永久'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                        {coupon.is_active ? '啟用中' : '停用'}
                                    </span>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(coupon)}>
                                        <Edit size={14} />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleDelete(coupon.code)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={14} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {coupons.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">目前沒有優惠券</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold">編輯優惠券</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            {/* Code */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">優惠代碼 (Code)</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={formData.code}
                                            onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                            placeholder="SUMMER2025"
                                            required
                                        />
                                        <Button type="button" variant="outline" onClick={handleGenerateCode} title="隨機產生">
                                            <RefreshCw size={16} />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">優惠類型</label>
                                    <select
                                        className="w-full border rounded p-2 text-sm"
                                        value={formData.discount_type}
                                        onChange={e => setFormData(prev => ({ ...prev, discount_type: e.target.value }))}
                                    >
                                        <option value="percentage">打折 (Percentage)</option>
                                        <option value="fixed_amount">折抵金額 (Fixed Amount)</option>
                                        <option value="free_shipping">免運費 (Free Shipping)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Value */}
                            {formData.discount_type !== 'free_shipping' && (
                                <div className="space-y-2 bg-blue-50 p-4 rounded">
                                    <label className="text-sm font-bold">
                                        {formData.discount_type === 'percentage' ? '折扣趴數 (例如打9折請填 10)' : '折抵金額'}
                                    </label>
                                    <Input
                                        type="number"
                                        value={formData.value}
                                        onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                                        placeholder={formData.discount_type === 'percentage' ? '10 (=10% OFF)' : '100'}
                                    />
                                    {formData.discount_type === 'percentage' && (
                                        <div className="text-xs text-blue-600">填寫 10 代表 10% OFF (九折)，填寫 20 代表 20% OFF (八折)</div>
                                    )}
                                </div>
                            )}

                            {/* Constraints */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">最低消費門檻 (Min Spend)</label>
                                    <Input
                                        type="number"
                                        value={formData.min_spend}
                                        onChange={e => setFormData(prev => ({ ...prev, min_spend: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">使用次數上限 (留空為無限)</label>
                                    <Input
                                        type="number"
                                        value={formData.usage_limit}
                                        onChange={e => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                                        placeholder="無限制"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">開始日期</label>
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">結束日期 (留空為永久)</label>
                                    <Input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Target Type */}
                            <div className="space-y-2 border-t pt-4">
                                <label className="text-sm font-bold block mb-2">適用商品範圍</label>
                                <div className="flex gap-4 mb-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="target_type"
                                            checked={formData.target_type === 'all'}
                                            onChange={() => setFormData(prev => ({ ...prev, target_type: 'all' }))}
                                        />
                                        全館通用
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="target_type"
                                            checked={formData.target_type === 'product_specific'}
                                            onChange={() => setFormData(prev => ({ ...prev, target_type: 'product_specific' }))}
                                        />
                                        指定商品
                                    </label>
                                </div>

                                {formData.target_type === 'product_specific' && (
                                    <div className="border rounded-lg p-2 max-h-48 overflow-y-auto bg-gray-50">
                                        {products.map(p => (
                                            <div key={p.id} className="flex items-center gap-2 py-1 px-2 hover:bg-white rounded cursor-pointer" onClick={() => toggleProductSelect(p.id)}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.target_product_ids.includes(p.id)}
                                                    readOnly
                                                />
                                                <span className="text-sm">{p.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                />
                                <label htmlFor="is_active" className="font-bold">啟用此優惠券</label>
                            </div>

                            <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? '儲存中...' : '儲存變更'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
