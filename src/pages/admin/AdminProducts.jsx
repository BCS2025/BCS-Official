import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Edit, Trash2, X, Save, Upload, AlertCircle, RefreshCw, Search, ChevronsUp, ChevronsDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { uploadFile } from '../../lib/storageService';
import { ConfigSchemaBuilder } from '../../components/admin/ConfigSchemaBuilder';
import { fetchAllShippingMethods, DEFAULT_ALLOWED_SHIPPING_METHODS } from '../../lib/shippingService';

export const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [savingSortIds, setSavingSortIds] = useState(new Set()); // Tracks which row is saving sort_order

    // Data for dropdowns
    const [materials, setMaterials] = useState([]);
    const [recipes, setRecipes] = useState([]); // Array of { material_id, quantity, match_condition }
    const [shippingMethodsList, setShippingMethodsList] = useState([]); // 用於物流 checkbox

    // Form State
    const [formData, setFormData] = useState(getInitialForm());
    const [jsonError, setJsonError] = useState(null);

    function getInitialForm() {
        return {
            id: '', // prod_xxx
            name: '',
            price: 0,
            is_on_sale: false,
            sale_price: 0,
            image_url: '',
            images: [], // Multiple images
            slogan: '', //  New Slogan Field
            description: '',
            config_schema: '[]', // Stringified JSON
            pricing_logic: {},   // New Pricing Logic
            sort_order: 5,
            is_active: true,
            category: 'creative', // 'creative'（創作商品）| 'materials'（創客材料）
            needs_proof: false,
            requires_file_upload: false,
            allowed_shipping_methods: [...DEFAULT_ALLOWED_SHIPPING_METHODS]
        };
    }

    useEffect(() => {
        fetchProducts();
        fetchMaterials();
        loadShippingMethods();
    }, []);

    async function fetchMaterials() {
        const { data } = await supabase.from('materials').select('*').order('name');
        if (data) setMaterials(data);
    }

    async function loadShippingMethods() {
        try {
            const list = await fetchAllShippingMethods();
            setShippingMethodsList(list);
        } catch (err) {
            console.error('Failed to load shipping methods:', err);
        }
    }

    async function fetchProducts() {
        setIsLoading(true);
        // Supabase query to get RAW data (not transformed)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('sort_order', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error:', error);
            alert('Failed to load products');
        } else {
            setProducts(data);
        }
        setIsLoading(false);
    }

    // --- GATEKEEPER LOGIC ---
    const handleIdChange = (e) => {
        let val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); // Enforce snake_case
        if (!val.startsWith('prod_')) {
            // Helper: If user deletes 'prod_', put it back or allow empty if clearing
            if (val.length > 0 && !'prod_'.startsWith(val)) {
                val = 'prod_' + val;
            }
        }
        setFormData(prev => ({ ...prev, id: val }));
    };

    const handleOpenEdit = async (product) => {
        // Fix: If images is empty array (db default), but image_url exists (legacy), use image_url
        let initialImages = product.images || [];
        if (initialImages.length === 0 && product.image_url) {
            initialImages = [product.image_url];
        }

        setFormData({
            ...product,
            sale_price: product.sale_price || 0, // Ensure number
            slogan: product.slogan || '',
            config_schema: JSON.stringify(product.config_schema, null, 2),
            pricing_logic: product.pricing_logic || {},
            images: initialImages,
            category: product.category || 'creative',
            allowed_shipping_methods: Array.isArray(product.allowed_shipping_methods) && product.allowed_shipping_methods.length > 0
                ? product.allowed_shipping_methods
                : [...DEFAULT_ALLOWED_SHIPPING_METHODS]
        });
        setJsonError(null);
        setIsModalOpen(true);

        // Fetch Recipes for this product
        const { data } = await supabase
            .from('product_recipes')
            .select('*')
            .eq('product_id', product.id);

        if (data) {
            setRecipes(data.map(r => ({
                material_id: r.material_id,
                quantity: r.quantity_required || 1,
                match_condition: r.match_condition ? JSON.stringify(r.match_condition) : ''
            })));
        } else {
            setRecipes([]);
        }
    };

    const handleOpenCreate = () => {
        const initialForm = getInitialForm();
        initialForm.description = `🔍 產品特色
✓ 特色一 | 說明
✓ 特色二 | 說明
✓ 特色三 | 說明

---
📐 商品規格
・尺寸：
・材質：
・款式：
・製作方式：

---
🏠 適用場景
・場景一
・場景二

---
💡 小提醒
・提醒一
・提醒二`;
        setFormData(initialForm);
        setJsonError(null);
        setRecipes([]);
        setIsModalOpen(true);
    };

    const handleAddRecipe = () => {
        setRecipes(prev => [...prev, { material_id: materials[0]?.id || '', quantity: 1, match_condition: '' }]);
    };

    const handleRemoveRecipe = (index) => {
        setRecipes(prev => prev.filter((_, i) => i !== index));
    };

    const handleRecipeChange = (index, field, value) => {
        setRecipes(prev => {
            const newRecipes = [...prev];
            newRecipes[index] = { ...newRecipes[index], [field]: value };
            return newRecipes;
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // 1. Validate ID
        if (!formData.id.match(/^prod_[a-z0-9_]+$/)) {
            alert('ID 格式錯誤！必須為 prod_ 開頭的小寫英文 (e.g., prod_dragon_lamp)');
            return;
        }

        // 2. Validate JSON
        let parsedSchema = [];
        try {
            parsedSchema = JSON.parse(formData.config_schema);
        } catch (err) {
            setJsonError('JSON 格式錯誤: ' + err.message);
            return;
        }

        setIsSaving(true);
        try {
            // Prepare Images
            const finalImages = formData.images || [];
            // Cover image is simply the first one in the list
            const primaryImage = finalImages.length > 0 ? finalImages[0] : '';

            const payload = {
                id: formData.id,
                name: formData.name,
                price: parseInt(formData.price),
                is_on_sale: formData.is_on_sale,
                sale_price: parseInt(formData.sale_price) || null,
                image_url: primaryImage,
                images: finalImages,
                slogan: formData.slogan,
                description: formData.description,
                sort_order: parseInt(formData.sort_order),
                is_active: formData.is_active,
                config_schema: parsedSchema,
                pricing_logic: formData.pricing_logic,
                category: formData.category || 'creative',
                needs_proof: !!formData.needs_proof,
                requires_file_upload: !!(formData.needs_proof && formData.requires_file_upload),
                allowed_shipping_methods: Array.isArray(formData.allowed_shipping_methods) && formData.allowed_shipping_methods.length > 0
                    ? formData.allowed_shipping_methods
                    : [...DEFAULT_ALLOWED_SHIPPING_METHODS]
            };

            // A. Upsert Product
            const { error: prodError } = await supabase
                .from('products')
                .upsert(payload);

            if (prodError) throw prodError;

            // B. Sync Recipes (Delete All -> Insert All)
            // Note: This requires RLS policy to allow DELETE/INSERT for Admin
            const { error: delError } = await supabase
                .from('product_recipes')
                .delete()
                .eq('product_id', formData.id);

            if (delError) throw delError;

            if (recipes.length > 0) {
                const recipePayload = recipes.map(r => ({
                    product_id: formData.id,
                    material_id: r.material_id,
                    quantity_required: parseFloat(r.quantity),
                    match_condition: r.match_condition ? JSON.parse(r.match_condition) : null
                }));

                const { error: insError } = await supabase
                    .from('product_recipes')
                    .insert(recipePayload);

                if (insError) throw insError;
            }

            alert('儲存成功！');
            setIsModalOpen(false);
            fetchProducts();

        } catch (err) {
            console.error(err);
            alert('儲存失敗: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const url = await uploadFile(file);
            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), url]
                // Do NOT auto-update image_url here, rely on images array order
            }));
        } catch (err) {
            alert('圖片上傳失敗');
        }
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    };

    // Inline update sort_order — optimistic UI then persist
    const updateSortOrder = async (productId, nextValue) => {
        const sanitized = parseInt(nextValue, 10);
        if (Number.isNaN(sanitized)) return;
        const target = products.find(p => p.id === productId);
        if (!target || target.sort_order === sanitized) return;

        // Optimistic update
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, sort_order: sanitized } : p));
        setSavingSortIds(prev => new Set(prev).add(productId));

        const { error } = await supabase
            .from('products')
            .update({ sort_order: sanitized })
            .eq('id', productId);

        setSavingSortIds(prev => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
        });

        if (error) {
            alert('權重更新失敗：' + error.message);
            fetchProducts(); // Rollback by refetching
        }
    };

    const sendToTop = (productId) => {
        const maxSort = products.reduce((max, p) => Math.max(max, p.sort_order || 0), 0);
        updateSortOrder(productId, maxSort + 1);
    };

    const sendToBottom = (productId) => {
        const minSort = products.reduce((min, p) => Math.min(min, p.sort_order || 0), products[0]?.sort_order || 0);
        updateSortOrder(productId, minSort - 1);
    };

    // Filtered view (search by name / id / category label)
    const filteredProducts = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return products;
        return products.filter(p => {
            const categoryLabel = p.category === 'materials' ? '創客材料 materials' : '創作商品 creative';
            const haystack = [p.name, p.id, p.slogan, categoryLabel].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(keyword);
        });
    }, [products, searchTerm]);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">商品管理 (Product Manager)</h1>
                <Button onClick={handleOpenCreate} className="flex items-center gap-2">
                    <Plus size={16} /> 新增商品
                </Button>
            </div>

            {/* Search + Summary */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="搜尋商品名稱、系統代號或分類..."
                        className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            aria-label="清除搜尋"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="text-sm text-gray-500">
                    {searchTerm
                        ? <>符合條件：<span className="font-bold text-gray-800">{filteredProducts.length}</span> / {products.length}</>
                        : <>共 <span className="font-bold text-gray-800">{products.length}</span> 項商品</>
                    }
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="p-4">商品資訊 (Name/ID)</th>
                                <th className="p-4">分類</th>
                                <th className="p-4">售價</th>
                                <th className="p-4 w-56">排序權重 ↓ (大在前)</th>
                                <th className="p-4">狀態</th>
                                <th className="p-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-gray-400">
                                        {searchTerm ? `找不到符合「${searchTerm}」的商品` : '尚無商品資料'}
                                    </td>
                                </tr>
                            )}
                            {filteredProducts.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="p-4 flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                            {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                                                <span>{p.name}</span>
                                                {p.needs_proof && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                                                        需對稿
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-mono text-xs text-blue-600 bg-blue-50 px-1 rounded inline-block">
                                                {p.id}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.category === 'materials' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {p.category === 'materials' ? '創客材料' : '創作商品'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {p.is_on_sale ? (
                                            <div>
                                                <span className="text-red-600 font-bold">${p.sale_price}</span>
                                                <span className="text-gray-400 text-sm line-through ml-2">${p.price}</span>
                                                <span className="block text-xs text-red-500 font-bold">SALE</span>
                                            </div>
                                        ) : (
                                            <span className="font-bold text-gray-800">${p.price}</span>
                                        )}
                                        <div className="text-xs text-gray-500 mt-1">
                                            已售: {p.sold_quantity || 0}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                defaultValue={p.sort_order ?? 0}
                                                key={`${p.id}-${p.sort_order}`}
                                                onBlur={(e) => updateSortOrder(p.id, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') e.target.blur();
                                                    if (e.key === 'Escape') {
                                                        e.target.value = p.sort_order ?? 0;
                                                        e.target.blur();
                                                    }
                                                }}
                                                className="w-16 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                title="修改後按 Enter 或移開游標即儲存"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => sendToTop(p.id)}
                                                disabled={savingSortIds.has(p.id)}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-40"
                                                title="置頂（設為最大權重 + 1）"
                                            >
                                                <ChevronsUp size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => sendToBottom(p.id)}
                                                disabled={savingSortIds.has(p.id)}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-40"
                                                title="置底（設為最小權重 - 1）"
                                            >
                                                <ChevronsDown size={16} />
                                            </button>
                                            {savingSortIds.has(p.id) && (
                                                <span className="text-[10px] text-blue-500 animate-pulse">儲存中</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className={`text-xs font-bold ${p.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                            {p.is_active ? '上架中' : '已隱藏'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(p)}>
                                            <Edit size={16} />
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                                            if (confirm('確定要永久刪除此商品嗎？\n\n警告：若有歷史訂單關聯此商品，刪除可能會失敗！\n若要避免影響歷史資料，建議使用「編輯」將商品設為【隱藏(下架)】即可。')) {
                                                try {
                                                    const { error } = await supabase.from('products').delete().eq('id', p.id);
                                                    if (error) throw error;
                                                    alert('✅ 商品刪除成功！');
                                                    fetchProducts();
                                                } catch (err) {
                                                    alert('❌ 刪除失敗 (可能已有訂單綁定此商品)：\n' + err.message);
                                                }
                                            }
                                        }}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold">商品編輯</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-black">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">商品名稱 (中文)</label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="例如：龍年限定燈"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">系統代號 (System ID)</label>
                                    <Input
                                        value={formData.id}
                                        onChange={handleIdChange}
                                        placeholder="prod_keychain_custom"
                                        className="font-mono bg-blue-50 text-blue-800 border-blue-200"
                                        required
                                        disabled={products.some(p => p.id === formData.id && p.id !== '') && formData.config_schema !== '{}'} // Disable only if editing existing logic
                                    />
                                    <p className="text-xs text-gray-500">格式強制：prod_小寫英文 (例: prod_dragon)</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">商品分類</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    >
                                        <option value="creative">創作商品（文創、燈、鑰匙圈等）</option>
                                        <option value="materials">創客材料（Arduino、零件、材料包等）</option>
                                    </select>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">原價</label>
                                    <Input type="number" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <input type="checkbox" checked={formData.is_on_sale} onChange={e => setFormData(prev => ({ ...prev, is_on_sale: e.target.checked }))} />
                                        啟用特價
                                    </label>
                                    <Input type="number"
                                        value={formData.sale_price}
                                        onChange={e => setFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                                        disabled={!formData.is_on_sale}
                                        className={!formData.is_on_sale ? 'opacity-50' : ''}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">排序權重 (大在前)</label>
                                    <Input type="number" value={formData.sort_order} onChange={e => setFormData(prev => ({ ...prev, sort_order: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 cursor-pointer" />
                                        上架此商品 (啟用)
                                    </label>
                                    <p className="text-xs text-gray-500">取消勾選將將商品隱藏，前台無法購買</p>
                                </div>
                            </div>

                            {/* 客製化設定 (對稿 / 上傳檔案) */}
                            <div className="space-y-3 border border-orange-200 bg-orange-50/50 p-5 rounded-xl">
                                <div>
                                    <label className="text-base font-bold text-orange-900 block">客製化設定（對稿與檔案上傳）</label>
                                    <span className="text-xs text-orange-700">控制此商品結帳時是否需要對稿確認、商品頁是否提供檔案上傳欄位</span>
                                </div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!formData.needs_proof}
                                        onChange={e => setFormData(prev => ({
                                            ...prev,
                                            needs_proof: e.target.checked,
                                            // 取消勾選主項時，requires_file_upload 自動歸 false
                                            requires_file_upload: e.target.checked ? prev.requires_file_upload : false
                                        }))}
                                        className="w-4 h-4 cursor-pointer"
                                    />
                                    此商品需要「製作前對稿」確認
                                </label>
                                <label className={`flex items-center gap-2 text-sm pl-6 ${formData.needs_proof ? 'text-gray-800 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}>
                                    <input
                                        type="checkbox"
                                        checked={!!formData.requires_file_upload}
                                        disabled={!formData.needs_proof}
                                        onChange={e => setFormData(prev => ({ ...prev, requires_file_upload: e.target.checked }))}
                                        className="w-4 h-4"
                                    />
                                    商品頁提供「客製化檔案上傳」欄位（客戶可選擇稍後透過 LINE 補上）
                                </label>
                            </div>

                            {/* 允許的物流方式（商品層級） */}
                            <div className="space-y-3 border border-emerald-200 bg-emerald-50/50 p-5 rounded-xl">
                                <div>
                                    <label className="text-base font-bold text-emerald-900 block">允許的物流方式</label>
                                    <span className="text-xs text-emerald-700">
                                        勾選此商品可使用的運送方式。預設不含「黑貓宅配」（大件商品才需勾選）。
                                        購物車會以所有商品的交集顯示給顧客。
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {(shippingMethodsList.length > 0 ? shippingMethodsList : [
                                        { id: 'store', name: '超商店到店' },
                                        { id: 'tcat', name: '黑貓宅配' },
                                        { id: 'post', name: '中華郵政' },
                                        { id: 'pickup', name: '自取' },
                                    ]).map(m => {
                                        const checked = (formData.allowed_shipping_methods || []).includes(m.id);
                                        return (
                                            <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-white border border-emerald-100 rounded-md hover:bg-emerald-50">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={e => {
                                                        setFormData(prev => {
                                                            const current = new Set(prev.allowed_shipping_methods || []);
                                                            if (e.target.checked) current.add(m.id);
                                                            else current.delete(m.id);
                                                            return { ...prev, allowed_shipping_methods: Array.from(current) };
                                                        });
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span className="font-medium text-gray-800">{m.name}</span>
                                                <span className="text-xs text-gray-400 font-mono ml-auto">{m.id}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {(!formData.allowed_shipping_methods || formData.allowed_shipping_methods.length === 0) && (
                                    <p className="text-xs text-red-600 font-bold">⚠️ 至少需勾選 1 種物流方式（未勾選時系統會回填預設清單）</p>
                                )}
                            </div>

                            {/* Config Editor (Moved up) */}
                            <div className="space-y-2 border-t pt-6 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-gray-700">客製化選項與加價設定</label>
                                    <div className="text-xs text-gray-500">
                                        設定商品的可選款式 (如尺寸、顏色) 及其額外加價
                                    </div>
                                </div>

                                <ConfigSchemaBuilder
                                    initialSchema={JSON.parse(formData.config_schema || '[]')}
                                    initialPricing={formData.pricing_logic || {}}
                                    onChange={(newFields, newPricing) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            config_schema: JSON.stringify(newFields, null, 2),
                                            pricing_logic: newPricing
                                        }));
                                    }}
                                />

                                {/* Fallback / Debug: Show Raw JSON if needed (Collapsible or hidden) */}
                                <details className="mt-4 border-t pt-4">
                                    <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 list-none font-bold">▶ 進階：檢視原始 JSON 設定</summary>
                                    <textarea
                                        value={formData.config_schema}
                                        onChange={e => setFormData(prev => ({ ...prev, config_schema: e.target.value }))}
                                        className={`w-full mt-2 p-4 font-mono text-sm border rounded h-64 bg-slate-900 text-green-400 ${jsonError ? 'border-red-500' : 'border-slate-700'}`}
                                    />
                                    {jsonError && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm font-bold mt-2">
                                            <AlertCircle size={16} /> {jsonError}
                                        </div>
                                    )}
                                </details>
                            </div>

                            {/* Recipe Manager (NEW) - Enhanced Visual Builder */}
                            <div className="space-y-4 border border-blue-200 bg-blue-50/50 p-5 rounded-xl">
                                <div className="flex justify-between items-center flex-wrap gap-2">
                                    <div>
                                        <label className="text-base font-bold text-blue-900 block">庫存扣除配方 (Inventory Recipes)</label>
                                        <span className="text-xs text-blue-700">設定商品或「特定規格組合」下單時，應該扣除哪些原料庫存</span>
                                    </div>
                                    <Button type="button" size="sm" onClick={handleAddRecipe} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1">
                                        <Plus size={16} /> 新增原料配方
                                    </Button>
                                </div>

                                {recipes.length === 0 && (
                                    <div className="text-sm text-gray-400 italic text-center py-6 bg-white/50 rounded-lg border border-dashed border-gray-300">
                                        尚未設定任何原料關聯 (所有規格銷售時皆不會自動扣除原料庫存)
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {recipes.map((r, idx) => {
                                        // Dynamic Schema Parsed for UI Builder
                                        let schemaFields = [];
                                        try {
                                            if (formData.config_schema) schemaFields = JSON.parse(formData.config_schema);
                                        } catch(e) {}
                                        
                                        let condObj = {};
                                        try {
                                            if(r.match_condition) condObj = JSON.parse(r.match_condition);
                                        } catch(e) {}
                                        
                                        const condKeys = Object.keys(condObj);
                                        const isAdvanced = (r.match_condition && r.match_condition.trim() !== '' && Object.keys(condObj).length === 0 && !r.match_condition.startsWith('{'));
                                        let uiMode = r.match_condition ? (isAdvanced ? 'advanced' : 'conditional') : 'always';

                                        return (
                                            <div key={idx} className="flex flex-col gap-3 p-4 bg-white border border-blue-100 rounded-xl shadow-sm relative group transition-all hover:shadow-md hover:border-blue-300">
                                                <button type="button" onClick={() => handleRemoveRecipe(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1.5 bg-gray-50 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                                    <Trash2 size={16} />
                                                </button>
                                                
                                                <div className="flex gap-4 items-end pr-8">
                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center block">
                                                            <span>1. 扣除原料</span>
                                                            <div className="flex items-center gap-3">
                                                                <button type="button" onClick={fetchMaterials} className="text-[10px] text-green-600 hover:text-green-800 underline flex items-center gap-0.5" title="若剛才新增了原料，可點此重新載入下拉選單">
                                                                    <RefreshCw size={10} /> 重新載入表單
                                                                </button>
                                                                <a href="/admin/inventory" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:text-blue-700 underline flex items-center gap-0.5">
                                                                    <Plus size={10} /> 前往新增原料
                                                                </a>
                                                            </div>
                                                        </label>
                                                        <select
                                                            className="w-full text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 p-2 border bg-gray-50 outline-none"
                                                            value={r.material_id}
                                                            onChange={e => handleRecipeChange(idx, 'material_id', e.target.value)}
                                                        >
                                                            <option value="">請選擇原料...</option>
                                                            {materials.map(m => (
                                                                <option key={m.id} value={m.id}>{m.name} (庫存: {m.current_stock})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="w-24 space-y-1">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">2. 每件用量</label>
                                                        <Input
                                                            type="number"
                                                            value={r.quantity}
                                                            onChange={e => handleRecipeChange(idx, 'quantity', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                    <label className="text-xs font-bold text-blue-800 min-w-max uppercase tracking-wider mt-2 md:mt-0">3. 觸發條件:</label>
                                                    <select 
                                                        className="text-sm border-blue-200 bg-white rounded-md p-1.5 focus:border-blue-500 focus:ring-blue-500 outline-none border"
                                                        value={uiMode}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if(val === 'always') {
                                                                handleRecipeChange(idx, 'match_condition', '');
                                                            } else if (val === 'conditional') {
                                                                if(schemaFields.length > 0) {
                                                                    const f = schemaFields[0];
                                                                    const v = f.options?.[0]?.value || '';
                                                                    handleRecipeChange(idx, 'match_condition', JSON.stringify({[f.name]: v}));
                                                                } else {
                                                                    handleRecipeChange(idx, 'match_condition', '{}');
                                                                }
                                                            } else {
                                                                handleRecipeChange(idx, 'match_condition', r.match_condition || '{}');
                                                            }
                                                        }}
                                                    >
                                                        <option value="always">無條件必備 (任何規格皆扣)</option>
                                                        <option value="conditional">當顧客選擇特定規格時</option>
                                                        <option value="advanced">進階模式 (手動 JSON)</option>
                                                    </select>

                                                    {uiMode === 'conditional' && schemaFields.length > 0 && (
                                                        <div className="flex flex-col gap-2 flex-1 w-full">
                                                            {condKeys.length === 0 && (
                                                                <Button type="button" size="sm" variant="outline" className="w-fit bg-white" onClick={() => {
                                                                    const f = schemaFields[0];
                                                                    const v = f.options?.[0]?.value || '';
                                                                    handleRecipeChange(idx, 'match_condition', JSON.stringify({[f.name]: v}));
                                                                }}>+ 設定條件</Button>
                                                            )}
                                                            {condKeys.map((key, cidx) => (
                                                                <div key={cidx} className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-xs text-blue-600 font-medium w-6 text-right">{cidx === 0 ? '若' : '且'}</span>
                                                                    <select
                                                                        value={key}
                                                                        onChange={e => {
                                                                            const newField = e.target.value;
                                                                            const fData = schemaFields.find(sf => sf.name === newField);
                                                                            const newVal = fData?.options?.[0]?.value || '';
                                                                            const newCond = { ...condObj };
                                                                            delete newCond[key];
                                                                            newCond[newField] = newVal;
                                                                            handleRecipeChange(idx, 'match_condition', JSON.stringify(newCond));
                                                                        }}
                                                                        className="text-sm border-gray-300 rounded-md p-1.5 border bg-white outline-none"
                                                                    >
                                                                        {schemaFields.map(f => (
                                                                            <option key={f.name} value={f.name}>{f.label || f.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <span className="text-xs text-blue-600 font-medium">款式為</span>
                                                                    <select
                                                                        value={condObj[key]}
                                                                        onChange={e => {
                                                                            const newCond = { ...condObj, [key]: e.target.value };
                                                                            handleRecipeChange(idx, 'match_condition', JSON.stringify(newCond));
                                                                        }}
                                                                        className="text-sm border-gray-300 rounded-md p-1.5 border bg-white outline-none flex-1 min-w-[120px] font-bold text-blue-900"
                                                                    >
                                                                        {schemaFields.find(f => f.name === key)?.options?.map(o => (
                                                                            <option key={o.value} value={o.value}>{o.label || o.value}</option>
                                                                        ))}
                                                                    </select>
                                                                    <button type="button" className="text-red-300 hover:text-red-500 p-1" onClick={() => {
                                                                        const newCond = { ...condObj };
                                                                        delete newCond[key];
                                                                        handleRecipeChange(idx, 'match_condition', Object.keys(newCond).length > 0 ? JSON.stringify(newCond) : '{}');
                                                                    }}>
                                                                        <X size={16}/>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {condKeys.length > 0 && schemaFields.length > condKeys.length && (
                                                                <button type="button" className="text-xs text-blue-600 font-bold hover:bg-blue-100 p-1 px-2 rounded self-start mt-1 transition-colors flex items-center gap-1" onClick={() => {
                                                                    const unusedField = schemaFields.find(sf => !condKeys.includes(sf.name));
                                                                    if (unusedField) {
                                                                        const v = unusedField.options?.[0]?.value || '';
                                                                        const newCond = { ...condObj, [unusedField.name]: v };
                                                                        handleRecipeChange(idx, 'match_condition', JSON.stringify(newCond));
                                                                    }
                                                                }}>
                                                                    <Plus size={12}/> 新增交集條件 (AND)
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {uiMode === 'conditional' && schemaFields.length === 0 && (
                                                        <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">請先於上方設定「客製化選項與加價設定」</span>
                                                    )}

                                                    {uiMode === 'advanced' && (
                                                        <Input
                                                            type="text"
                                                            value={r.match_condition}
                                                            onChange={e => handleRecipeChange(idx, 'match_condition', e.target.value)}
                                                            className="font-mono text-sm flex-1 bg-white"
                                                            placeholder='{"field": "value"}'
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Image - Multi-Image Support */}
                            <div className="space-y-2 border-t pt-6">
                                <label className="text-sm font-bold text-gray-700">商品圖片 (第一張為封面圖)</label>

                                <div className="flex flex-wrap gap-4 mb-2">
                                    {(formData.images || [])
                                        .filter(img => img) // Filter out empty strings
                                        .map((img, idx) => (
                                            <div key={idx} className="relative w-24 h-24 border rounded overflow-hidden group">
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center">封面</span>}
                                            </div>
                                        ))}

                                    {/* Add Button */}
                                    <label className="w-24 h-24 border border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400 hover:text-gray-600">
                                        <Upload size={24} />
                                        <span className="text-xs mt-1">上傳</span>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                </div>

                                <div className="text-xs text-gray-500">
                                    提示: 可上傳多張圖片，第一張將作為商品列表封面。
                                </div>
                            </div>

                            {/* Slogan */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">產品 Slogan (簡短標語)</label>
                                <Input
                                    value={formData.slogan}
                                    onChange={e => setFormData(prev => ({ ...prev, slogan: e.target.value }))}
                                    placeholder="實用與美感兼具，記錄生活的美好時刻。"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">詳細圖文說明 (支援 Markdown 風格)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full p-2 border rounded h-64 font-mono text-sm leading-relaxed"
                                />
                            </div>

                            <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white pb-6">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
                                <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
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
