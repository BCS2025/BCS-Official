import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Edit, Trash2, X, Save, Upload, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { uploadFile } from '../../lib/storageService';

export const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Data for dropdowns
    const [materials, setMaterials] = useState([]);
    const [recipes, setRecipes] = useState([]); // Array of { material_id, quantity, match_condition }

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
            description: '',
            config_schema: '[]', // Stringified JSON
            sort_order: 10,
            is_active: true
        };
    }

    useEffect(() => {
        fetchProducts();
        fetchMaterials();
    }, []);

    async function fetchMaterials() {
        const { data } = await supabase.from('materials').select('*').order('name');
        if (data) setMaterials(data);
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
        setFormData({
            ...product,
            sale_price: product.sale_price || 0, // Ensure number
            config_schema: JSON.stringify(product.config_schema, null, 2),
            images: product.images || (product.image_url ? [product.image_url] : [])
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
                quantity: r.quantity,
                match_condition: r.match_condition ? JSON.stringify(r.match_condition) : ''
            })));
        } else {
            setRecipes([]);
        }
    };

    const handleOpenCreate = () => {
        setFormData(getInitialForm());
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
            // Prepare Images: default to array, sync image_url to first item
            const finalImages = formData.images || [];
            if (formData.image_url && !finalImages.includes(formData.image_url)) {
                finalImages.unshift(formData.image_url);
            }
            const primaryImage = finalImages.length > 0 ? finalImages[0] : '';

            const payload = {
                id: formData.id,
                name: formData.name,
                price: parseInt(formData.price),
                is_on_sale: formData.is_on_sale,
                sale_price: parseInt(formData.sale_price) || null,
                image_url: primaryImage,
                images: finalImages,
                description: formData.description,
                sort_order: parseInt(formData.sort_order),
                is_active: formData.is_active,
                config_schema: parsedSchema
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
                    quantity: parseFloat(r.quantity),
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
                images: [...(prev.images || []), url],
                image_url: url // Update preview immediately (optional, or rely on array)
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

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">商品管理 (Product Manager)</h1>
                <Button onClick={handleOpenCreate} className="flex items-center gap-2">
                    <Plus size={16} /> 新增商品
                </Button>
            </div>

            {/* List View */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="p-4">商品資訊 (Name/ID)</th>
                                <th className="p-4">售價</th>
                                <th className="p-4">排序/狀態</th>
                                <th className="p-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="p-4 flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                            {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{p.name}</div>
                                            <div className="font-mono text-xs text-blue-600 bg-blue-50 px-1 rounded inline-block">
                                                {p.id}
                                            </div>
                                        </div>
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
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm">排序: {p.sort_order}</div>
                                        <div className={`text-xs font-bold ${p.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                            {p.is_active ? '上架中' : '已隱藏'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(p)}>
                                            <Edit size={16} />
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
                            </div>

                            {/* Recipe Manager (NEW) */}
                            <div className="space-y-2 border border-blue-200 bg-blue-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-blue-900">關聯原料配方 (Product Recipes)</label>
                                    <Button type="button" size="sm" variant="outline" onClick={handleAddRecipe}>
                                        <Plus size={14} /> 新增原料關聯
                                    </Button>
                                </div>

                                {recipes.length === 0 && <div className="text-sm text-gray-500 italic">尚未設定任何原料關聯 (銷售時不會扣除庫存)</div>}

                                {recipes.map((r, idx) => (
                                    <div key={idx} className="flex gap-2 items-start mb-2">
                                        <div className="flex-1">
                                            <select
                                                className="w-full text-sm border rounded p-2"
                                                value={r.material_id}
                                                onChange={e => handleRecipeChange(idx, 'material_id', e.target.value)}
                                            >
                                                <option value="">請選擇原料...</option>
                                                {materials.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name} (庫存: {m.current_stock})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                placeholder="數量"
                                                value={r.quantity}
                                                onChange={e => handleRecipeChange(idx, 'quantity', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                type="text"
                                                placeholder='條件 JSON (例: {"siding":"double"})'
                                                className="font-mono text-xs"
                                                value={r.match_condition}
                                                onChange={e => handleRecipeChange(idx, 'match_condition', e.target.value)}
                                            />
                                        </div>
                                        <button type="button" onClick={() => handleRemoveRecipe(idx)} className="text-red-500 hover:text-red-700 p-2">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Image - Multi-Image Support */}
                            <div className="space-y-2">
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

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">商品描述</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full p-2 border rounded h-20"
                                />
                            </div>

                            {/* Config Editor */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-gray-700">選項設定 (Config Schema JSON)</label>
                                    <a href="#" className="text-xs text-blue-600 underline">查看 JSON 範例</a>
                                </div>
                                <textarea
                                    value={formData.config_schema}
                                    onChange={e => setFormData(prev => ({ ...prev, config_schema: e.target.value }))}
                                    className={`w-full p-4 font-mono text-sm border rounded h-64 bg-slate-900 text-green-400 ${jsonError ? 'border-red-500' : 'border-slate-700'}`}
                                />
                                {jsonError && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm font-bold">
                                        <AlertCircle size={16} /> {jsonError}
                                    </div>
                                )}
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
