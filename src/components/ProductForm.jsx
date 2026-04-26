import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { VisualOptionSelector } from './ui/VisualOptionSelector';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/Card';
import { formatCurrency } from '../lib/pricing';
import { Loader2 } from 'lucide-react';

import { supabase } from '../lib/supabaseClient';

// Select 欄位沒有 defaultValue 時，自動補第一個 option 的 value。
// 避免 React state 為空字串（""）卻在 UI 上顯示第一個選項的假象，
// 導致 RPC 的 match_condition 永遠匹配不到 recipe → 誤回 9999「庫存充足」。
function getFieldDefault(field) {
    if (field.defaultValue) return field.defaultValue;
    if (field.type === 'select' && field.options?.length > 0) {
        return field.options[0].value;
    }
    return '';
}

function buildFormDefaults(product) {
    const defaults = { quantity: 1, price: 0 };
    product.fields.forEach(field => {
        defaults[field.name] = getFieldDefault(field);
    });
    if (product.requiresFileUpload) {
        defaults.proofFile = null;
        defaults.proofFileLater = false;
    }
    return defaults;
}

// 系統保留欄位名 — 與管理員自設 fields 衝突時，以管理員設定優先（不顯示系統欄位）
const PROOF_FIELD_NAME = 'proofFile';
const hasAdminProofFieldConflict = (product) =>
    Array.isArray(product?.fields) && product.fields.some(f => f.name === PROOF_FIELD_NAME);

export default function ProductForm({ product, onAddToCart, initialData = null, onCancelEdit, cart = [] }) {

    const [formData, setFormData] = useState(() => {
        if (initialData) return { ...initialData };
        return buildFormDefaults(product);
    });

    const [estimatedPrice, setEstimatedPrice] = useState(0);
    const [maxStock, setMaxStock] = useState(null); // Initialize as null (unknown)
    const [isLowStock, setIsLowStock] = useState(false); // Controls display text
    const [isLoadingStock, setIsLoadingStock] = useState(false);

    // 是否需顯示系統 proofFile 欄位（管理員另行設定同名欄位時，讓位給管理員）
    const adminProofConflict = hasAdminProofFieldConflict(product);
    if (product.requiresFileUpload && adminProofConflict) {
        console.warn(`[ProductForm] product ${product.id} 已自設 proofFile 欄位，系統不再插入對稿上傳欄位`);
    }
    const showProofUpload = !!product.requiresFileUpload && !adminProofConflict;

    // Deep compare helper for cart dependency
    const cartDependency = JSON.stringify(cart.filter(item => item.productId === product.id));

    // ... (Effect hooks are fine, just make sure they use the new state setter if needed - addressed in previous step)
    // ...

    const isEditing = !!initialData;

    // UI Logic
    const remainingStock = maxStock === null ? '...' : maxStock;
    const isOutOfStock = maxStock !== null && maxStock <= 0;

    // Validation Limit (Always active)
    const hasStockLimit = maxStock !== null && maxStock < 9999;

    // Display Logic: Show number ONLY if Low Stock. Otherwise "Sufficient".
    // But if Out of Stock, show "Out of Stock" (handled by isOutOfStock check in JSX)
    const showExactStock = isLowStock && hasStockLimit;

    // Fetch Stock from Supabase based on current selection
    useEffect(() => {
        let isCancelled = false;

        async function checkStock() {
            setIsLoadingStock(true);
            try {
                // Pass cart items to calculate effective stock
                const { data, error } = await supabase
                    .rpc('calculate_max_stock', {
                        p_product_id: product.id,
                        p_variants: formData,
                        p_cart_items: cart
                    });

                if (error) throw error;

                if (!isCancelled) {
                    // data is now { max_quantity: int, is_low_stock: bool }
                    // OR null if something failed (fallback)
                    if (data && typeof data === 'object') {
                        setMaxStock(data.max_quantity);
                        setIsLowStock(data.is_low_stock);
                    } else {
                        // Fallback for unexpected format (or old API version cached)
                        setMaxStock(typeof data === 'number' ? data : 9999);
                        setIsLowStock(false);
                    }
                }
            } catch (err) {
                console.error("Stock Check Error:", err);
                if (!isCancelled) {
                    setMaxStock(9999);
                    setIsLowStock(false);
                }
            } finally {
                if (!isCancelled) setIsLoadingStock(false);
            }
        }

        checkStock();

        return () => {
            isCancelled = true;
        };
        // Depend on all variant fields (excluding quantity/price)
        // We use JSON.stringify to deep compare the relevant parts of formData
    }, [
        JSON.stringify(
            Object.fromEntries(
                Object.entries(formData).filter(([k]) => k !== 'quantity' && k !== 'price')
            )
        ),
        product.id,
        cartDependency
    ]);

    // Recalculate price whenever formData changes (including quantity)
    useEffect(() => {
        const price = product.calculatePrice(formData, formData.quantity);
        setEstimatedPrice(price);
        // We do NOT update formData.price here to avoid circular dependency and unnecessary renders.
        // formData.price is only used for initial state or submission, which we handle in handleSubmit.
    }, [formData, product]);

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        } else {
            setFormData(buildFormDefaults(product));
        }
    }, [initialData, product]);

    const handleChange = (e) => {
        const { id, value, files } = e.target;
        if (files) {
            setFormData(prev => ({ ...prev, [id]: files[0] }));
        } else {
            let newValue = value;

            // Auto-clamp quantity
            if (id === 'quantity') {
                const limit = maxStock === null ? 9999 : maxStock;
                const stockLimitExceeded = limit < 9999;

                const qty = parseInt(value, 10);
                if (!isNaN(qty) && stockLimitExceeded && qty > limit) {
                    newValue = limit;
                }
            }

            setFormData(prev => ({ ...prev, [id]: newValue }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isLoadingStock || maxStock === null) {
            alert("正在確認庫存，請稍後...");
            return;
        }

        if (formData.quantity < 1) return;

        // 對稿檔案上傳檢查：未勾「稍後上傳」且未選檔 → 阻擋
        if (showProofUpload && !formData.proofFileLater && !formData.proofFile) {
            alert('請上傳客製化檔案，或勾選「我稍後再透過 LINE 提供檔案」');
            return;
        }

        const limit = maxStock;
        const stockLimitExceeded = limit < 9999;

        const currentQty = parseInt(formData.quantity, 10);
        if (stockLimitExceeded && currentQty > limit) {
            alert(`庫存不足！目前剩餘可購買數量為: ${limit}`);
            setFormData(prev => ({ ...prev, quantity: limit }));
            return;
        }

        const finalPrice = product.calculatePrice(formData, formData.quantity);

        onAddToCart({
            ...formData,
            price: finalPrice,
            productId: product.id,
            productName: product.name,
            _id: initialData?._id || Date.now().toString()
        });
    };




    return (
        <Card className={`w-full transition-all duration-300 ${isEditing ? 'ring-2 ring-store-500 shadow-lg bg-store-50/50' : ''}`}>
            {isEditing && (
                <div className="bg-store-500 text-white text-xs font-bold px-4 py-1 rounded-t text-center uppercase tracking-wider">
                    正在修改訂單項目
                </div>
            )}
            {isEditing || product.priceDescription ? (
                <CardHeader className={!isEditing ? "pb-0" : ""}>
                    {isEditing && (
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>{product.name}</CardTitle>
                            </div>
                        </div>
                    )}
                    {product.priceDescription && (
                        <p className={`text-sm text-bcs-muted font-medium ${isEditing ? 'mt-2' : ''}`}>
                            {product.priceDescription}
                        </p>
                    )}
                </CardHeader>
            ) : null}
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {product.fields.map((field) => {
                        // Check condition if field exists
                        if (field.condition && !field.condition(formData)) return null;

                        if (field.type === 'select') {
                            const hasImages = field.options.some(opt => opt.image);

                            if (hasImages) {
                                return (
                                    <VisualOptionSelector
                                        key={field.name}
                                        id={field.name}
                                        label={field.label}
                                        options={field.options}
                                        value={formData[field.name]}
                                        onChange={handleChange}
                                        required={field.required}
                                    />
                                );
                            }

                            return (
                                <Select
                                    key={field.name}
                                    id={field.name}
                                    label={field.label}
                                    options={field.options}
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    required={field.required}
                                />
                            );
                        }
                        if (field.type === 'file') {
                            return (
                                <div key={field.name} className="space-y-2">
                                    <label htmlFor={field.name} className="text-sm font-medium text-bcs-black block">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <Input
                                        id={field.name}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleChange}
                                        required={field.required}
                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-store-50 file:text-store-700 hover:file:bg-store-100 cursor-pointer"
                                    />
                                    {formData[field.name] && (
                                        <p className="text-xs text-green-600">
                                            已選擇: {formData[field.name].name}
                                        </p>
                                    )}
                                </div>
                            );
                        }

                        if (field.type === 'text') {
                            return (
                                <Input
                                    key={field.name}
                                    id={field.name}
                                    type="text"
                                    label={field.label}
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    maxLength={field.maxLength}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                />
                            );
                        }
                        return null;
                    })}

                    {showProofUpload && (
                        <div className="space-y-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <label htmlFor={PROOF_FIELD_NAME} className="text-sm font-medium text-bcs-black block">
                                客製化檔案上傳 {!formData.proofFileLater && <span className="text-red-500">*</span>}
                            </label>
                            <p className="text-xs text-orange-700">支援圖片、PDF、AI、SVG 等格式，將用於設計師製作前對稿</p>
                            <Input
                                id={PROOF_FIELD_NAME}
                                type="file"
                                onChange={handleChange}
                                disabled={!!formData.proofFileLater}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-store-50 file:text-store-700 hover:file:bg-store-100 cursor-pointer"
                            />
                            {formData.proofFile && !formData.proofFileLater && (
                                <p className="text-xs text-green-600">已選擇: {formData.proofFile.name}</p>
                            )}
                            <label className="flex items-center gap-2 text-sm text-bcs-black cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={!!formData.proofFileLater}
                                    onChange={e => setFormData(prev => ({
                                        ...prev,
                                        proofFileLater: e.target.checked,
                                        // 勾選稍後上傳 → 清掉已選檔案
                                        proofFile: e.target.checked ? null : prev.proofFile
                                    }))}
                                    className="w-4 h-4"
                                />
                                我稍後再透過 LINE 提供檔案
                            </label>
                        </div>
                    )}

                    <div className="space-y-1">
                        <Input
                            id="quantity"
                            type="number"
                            label="數量"
                            min="1"
                            max={hasStockLimit ? remainingStock : 999}
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                            disabled={isOutOfStock}
                        />
                        <div className="flex items-center gap-2 text-xs">
                            {isLoadingStock ? (
                                <span className="flex items-center text-bcs-muted">
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    庫存確認中...
                                </span>
                            ) : isOutOfStock ? (
                                <span className="text-red-600 font-bold">
                                    ⚠️ 目前缺貨中
                                </span>
                            ) : showExactStock ? (
                                <span className="text-bcs-muted">
                                    庫存剩餘: {remainingStock}
                                </span>
                            ) : (
                                <span className="text-green-600">
                                    庫存充足
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center rounded-lg bg-store-50 p-3 mt-4 border border-store-100">
                        <span className="text-sm font-medium text-bcs-muted">預估金額</span>
                        <span className="text-xl font-bold text-bcs-black">{formatCurrency(estimatedPrice)}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-3">
                    {isEditing && (
                        <Button type="button" variant="outline" onClick={onCancelEdit} className="flex-1">
                            取消修改
                        </Button>
                    )}
                    <Button type="submit" className="flex-1" disabled={isOutOfStock || (hasStockLimit && formData.quantity > remainingStock)}>
                        {isEditing ? '更新購買清單' : (isOutOfStock ? '缺貨中' : '加入購買清單')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
