import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { VisualOptionSelector } from './ui/VisualOptionSelector';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/Card';
import { formatCurrency } from '../lib/pricing';

export default function ProductForm({ product, onAddToCart, initialData = null, onCancelEdit }) {
    // ... (keep logic same)

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
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.quantity < 1) return;
        onAddToCart({
            ...formData,
            productId: product.id,
            productName: product.name,
            _id: initialData?._id || Date.now().toString() // Preserve ID if editing
        });
        // Form reset is handled by parent passing null to initialData, which triggers useEffect
    };

    const isEditing = !!initialData;

    return (
        <Card className={`w-full transition-all duration-300 ${isEditing ? 'ring-2 ring-wood-500 shadow-lg bg-wood-50/50' : ''}`}>
            {isEditing && (
                <div className="bg-wood-600 text-white text-xs font-bold px-4 py-1 rounded-t text-center uppercase tracking-wider">
                    正在修改訂單項目
                </div>
            )}
            <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <p className="text-sm text-wood-500">{product.description}</p>
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

                    <Input
                        id="quantity"
                        type="number"
                        label="數量"
                        min="1"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                    />

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
                    <Button type="submit" className="flex-1">
                        {isEditing ? '更新購買清單' : '加入購買清單'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
