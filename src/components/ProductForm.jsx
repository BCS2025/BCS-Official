import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { VisualOptionSelector } from './ui/VisualOptionSelector';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/Card';
import { formatCurrency } from '../lib/pricing';
import { Loader2 } from 'lucide-react';

export default function ProductForm({ product, onAddToCart, initialData = null, onCancelEdit }) {
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbyO90PCWLiKQHvCn_tuBTHL4X-SdGYutHnepLKPLzKudSXP6A0E8Jix8MKKL_syyuGw/exec';

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
    const [inventory, setInventory] = useState({});
    const [isLoadingStock, setIsLoadingStock] = useState(true);

    // Fetch Inventory on Mount
    useEffect(() => {
        fetch(`${GAS_URL}?action=getInventory`)
            .then(res => res.json())
            .then(data => {
                if (data.result === 'success') {
                    setInventory(data.inventory);
                }
            })
            .catch(err => console.error("Stock Fetch Error", err))
            .finally(() => setIsLoadingStock(false));
    }, []);

    // Recalculate price whenever formData changes
    useEffect(() => {
        const price = product.calculatePrice(formData, formData.quantity);
        setEstimatedPrice(price);
        setFormData(prev => ({ ...prev, price }));
    }, [formData.siding, formData.quantity, product]); // Depend on price-affecting fields

    // Reset form when initialData changes (Fix for Edit Mode)
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
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.quantity < 1) return;

        // Force recalculate price to avoid 0/stale state
        const finalPrice = product.calculatePrice(formData, formData.quantity);

        onAddToCart({
            ...formData,
            price: finalPrice, // Use newly calculated price
            productId: product.id,
            productName: product.name,
            _id: initialData?._id || Date.now().toString() // Preserve ID if editing
        });
        // Form reset is handled by parent passing null to initialData, which triggers useEffect
    };

    const isEditing = !!initialData;

    // Calculate Stock
    const currentSku = formData.shape ? `${product.id}-${formData.shape}` : product.id;
    const stockRaw = inventory[currentSku];
    const hasStockLimit = stockRaw !== undefined;
    const remainingStock = hasStockLimit ? parseInt(stockRaw, 10) : 999;
    const isOutOfStock = remainingStock <= 0;

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
