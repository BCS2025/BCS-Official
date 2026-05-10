import { formatCurrency } from '../lib/pricing';
import { isMethodFreeShipping } from '../lib/shippingService';

export default function ShippingMethodSelector({
    methods = [],
    allowedIds = null, // null = 不限制；陣列 = 僅顯示可勾選範圍，其餘灰階 disabled
    selectedMethod,
    onSelect,
    itemsTotal = 0,
}) {
    if (!methods || methods.length === 0) {
        return (
            <div className="text-sm text-bcs-muted italic p-3 bg-gray-50 border border-gray-200 rounded-lg">
                物流方式載入中...
            </div>
        );
    }

    const allowedSet = Array.isArray(allowedIds) ? new Set(allowedIds) : null;

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-bcs-black">選擇運送方式</label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {methods.map((method) => {
                    const Icon = method.iconComponent;
                    const isSelected = selectedMethod === method.id;
                    const isAllowed = !allowedSet || allowedSet.has(method.id);
                    const isFree = isAllowed && isMethodFreeShipping(method, itemsTotal);

                    const baseClasses = 'relative flex items-start gap-3 p-3 rounded-lg border-2 transition-all';
                    const stateClasses = !isAllowed
                        ? 'border-bcs-border bg-gray-100 opacity-50 cursor-not-allowed'
                        : isSelected
                            ? 'border-store-500 bg-store-50 ring-1 ring-store-500 cursor-pointer'
                            : 'border-bcs-border hover:border-bcs-border bg-white cursor-pointer';

                    return (
                        <div
                            key={method.id}
                            onClick={() => isAllowed && onSelect(method.id, method.price)}
                            className={`${baseClasses} ${stateClasses}`}
                            title={!isAllowed ? '購物車內有商品不支援此物流' : undefined}
                        >
                            <div className={`p-2 rounded-full shrink-0 ${isSelected ? 'bg-store-500 text-white' : 'bg-store-50 text-store-500'}`}>
                                {Icon && <Icon size={20} />}
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
                                {!isAllowed && (
                                    <p className="text-[11px] text-red-500 mt-1 font-medium">此方式不支援購物車內某項商品</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
