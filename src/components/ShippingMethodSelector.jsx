import { Truck, MapPin, Store, Mail } from 'lucide-react';
import { formatCurrency } from '../lib/pricing';

export const SHIPPING_METHODS = [
    { id: 'store',  name: '超商店到店',   price: 60,  icon: Store, description: '7-11 / 全家 / 萊爾富 / OK，線上選店' },
    { id: 'tcat',   name: '黑貓宅配',     price: 180, icon: Truck, description: '本島 1–2 天，常溫包裹' },
    { id: 'post',   name: '中華郵政',     price: 80,  icon: Mail,  description: '郵局包裹，本島 2–3 天' },
    { id: 'pickup', name: '自取',         price: 0,   icon: MapPin, description: '全家永康勝華店 / 7-11 北園門市' },
];

export default function ShippingMethodSelector({ selectedMethod, onSelect, isFreeShipping }) {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-bcs-black">選擇運送方式</label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {SHIPPING_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;
                    const isFree = isFreeShipping && method.price > 0;

                    return (
                        <div
                            key={method.id}
                            onClick={() => onSelect(method.id, method.price)}
                            className={`
                                relative flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                ${isSelected
                                    ? 'border-store-500 bg-store-50 ring-1 ring-store-500'
                                    : 'border-bcs-border hover:border-bcs-border bg-white'}
                            `}
                        >
                            <div className={`p-2 rounded-full shrink-0 ${isSelected ? 'bg-store-500 text-white' : 'bg-store-50 text-store-500'}`}>
                                <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center gap-2">
                                    <span className="font-bold text-bcs-black">{method.name}</span>
                                    <div className="text-right shrink-0">
                                        {isFree ? (
                                            <>
                                                <span className="text-xs text-bcs-muted line-through mr-1">${method.price}</span>
                                                <span className="text-sm font-bold text-red-500">免運</span>
                                            </>
                                        ) : (
                                            <span className={`text-sm font-bold ${method.price > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                {method.price > 0 ? `+${formatCurrency(method.price)}` : '免運'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-bcs-muted mt-1 leading-snug">{method.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
