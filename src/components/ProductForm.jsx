import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { VisualOptionSelector } from './ui/VisualOptionSelector';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/Card';
import { formatCurrency } from '../lib/pricing';
import { Loader2 } from 'lucide-react';

import { supabase } from '../lib/supabaseClient';

export default function ProductForm({ product, onAddToCart, initialData = null, onCancelEdit, cart = [] }) {

    const [formData, setFormData] = useState(() => {
        if (initialData) return { ...initialData };

        const defaults = {
            quantity: 1,
            price: 0
        };
        product.fields.forEach(field => {
            defaults[field.name] = field.defaultValue || '';
        });
        return defaults;
    });

    const [estimatedPrice, setEstimatedPrice] = useState(0);
    const [maxStock, setMaxStock] = useState(null); // Initialize as null (unknown)
    const [isLoadingStock, setIsLoadingStock] = useState(false);

    // Deep compare helper for cart dependency
    const cartDependency = JSON.stringify(cart.filter(item => item.productId === product.id));

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
                    // console.log("Stock for", product.name, formData, "is", data);
                    // If RPC returns null (no recipe), we consider it unlimited (9999)
                    setMaxStock(data === null ? 9999 : data);
                }
            } catch (err) {
                console.error("Stock Check Error:", err);
                if (!isCancelled) setMaxStock(9999);
            } finally {
                if (!isCancelled) setIsLoadingStock(false);
            }
        }

        checkStock(); // Call immediately, debounce logic was causing race conditions with "typing"

        return () => {
            isCancelled = true;
        };
    }, [formData.shape, formData.material, formData.lightBase, product.id, cartDependency]);

    // Recalculate price whenever formData changes
    useEffect(() => {
        const price = product.calculatePrice(formData, formData.quantity);
        setEstimatedPrice(price);
        setFormData(prev => ({ ...prev, price }));
    }, [formData.siding, formData.quantity, product]);

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        } else {
            const defaults = {
                quantity: 1,
                price: 0
            };
            product.fields.forEach(field => {
                defaults[field.name] = field.defaultValue || '';
            });
            setFormData(defaults);
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

    const isEditing = !!initialData;

    // UI Logic
    // If maxStock is null, we are loading.
    const remainingStock = maxStock === null ? '...' : maxStock;
    const isOutOfStock = maxStock !== null && maxStock <= 0;
    const hasStockLimit = maxStock !== null && maxStock < 9999;



    return (
        <Card className={`w-full transition-all duration-300 ${isEditing ? 'ring-2 ring-wood-500 shadow-lg bg-wood-50/50' : ''}`}>
            {isEditing && (
                <div className="bg-wood-600 text-white text-xs font-bold px-4 py-1 rounded-t text-center uppercase tracking-wider">
                    正在修改訂單項目
                </div>
            )}
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{product.name}</CardTitle>
                        <p className="text-sm text-wood-500">{product.description}</p>
                    </div>
                </div>
                <p className="text-sm text-wood-600 font-medium mt-1">{product.priceDescription}</p>
            </CardHeader>
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
                                    <label htmlFor={field.name} className="text-sm font-medium text-wood-700 block">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <Input
                                        id={field.name}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleChange}
                                        required={field.required}
                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-wood-50 file:text-wood-700 hover:file:bg-wood-100 cursor-pointer"
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
                                <span className="flex items-center text-wood-500">
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    庫存確認中...
                                </span>
                            ) : hasStockLimit ? (
                                <span className={`${isOutOfStock ? 'text-red-600 font-bold' : 'text-wood-600'}`}>
                                    {isOutOfStock ? '⚠️ 目前缺貨中' : `庫存剩餘: ${remainingStock}`}
                                </span>
                            ) : (
                                <span className="text-green-600">
                                    庫存充足
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center rounded-lg bg-wood-50 p-3 mt-4 border border-wood-100">
                        <span className="text-sm font-medium text-wood-600">預估金額</span>
                        <span className="text-xl font-bold text-wood-800">{formatCurrency(estimatedPrice)}</span>
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
