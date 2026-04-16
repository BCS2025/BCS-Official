import { Truck, MapPin, Store, Users } from 'lucide-react';
import { formatCurrency } from '../lib/pricing';

const SHIPPING_METHODS = [
    { id: 'store',  name: '超商一般店到店',    price: 60, icon: Store, description: '需提供超商門市' },
    { id: 'post',   name: '郵局掛號 (小包)',   price: 40, icon: Truck, description: '需提供詳細地址' },
    { id: 'pickup', name: '自取',              price: 0,  icon: MapPin, description: '全家永康勝華店 / 7-11 北園門市' },
    { id: 'friend', name: '親友代領',          price: 0,  icon: Users,  description: '需填寫代領人姓名' },
];

export default function ShippingMethodSelector({ selectedMethod, onSelect, isFreeShipping }) {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-wood-800">選擇運送方式</label>
            <div className="grid gap-3 sm:grid-cols-2">
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
                                    ? 'border-wood-600 bg-wood-50 ring-1 ring-wood-600'
                                    : 'border-wood-200 hover:border-wood-300 bg-white'}
                            `}
                        >
                            <div className={`p-2 rounded-full ${isSelected ? 'bg-wood-600 text-white' : 'bg-wood-100 text-wood-600'}`}>
                                <Icon size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-wood-900">{method.name}</span>
                                    <div className="text-right">
                                        {isFree ? (
                                            <>
                                                <span className="text-xs text-wood-400 line-through mr-1">${method.price}</span>
                                                <span className="text-sm font-bold text-red-500">免運</span>
                                            </>
                                        ) : (
                                            <span className={`text-sm font-bold ${method.price > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                {method.price > 0 ? `+${formatCurrency(method.price)}` : '免運'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-wood-500 mt-1">{method.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
