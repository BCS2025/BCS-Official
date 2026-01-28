
import { Link } from 'react-router-dom';
import OrderList from './OrderList';
import CustomerInfo from './CustomerInfo';
import { Button } from './ui/Button';
import { Send, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../lib/pricing';
import { calculateLeadDays, getEstimatedShipDate } from '../lib/utils';

export default function Cart({
    cart,
    customer,
    shippingCost,
    onEdit,
    onDelete,
    onCustomerChange,
    onShippingCostChange,
    onSubmit,
    isSubmitting,
    isFreeShipping,
    FREE_SHIPPING_THRESHOLD,
    itemsTotal
}) {
    // Helper to extract display labels
    // Note: We might need to pass this down or import it if the logic is complex.
    // For now, we reuse the simple logic or rely on stored labels if we saved them.
    // A better approach is to rely on the OrderList to display what it has.

    // We need 'getProductLabel' logic here if OrderList depends on it being passed as a prop.
    // In App.jsx, it used `activeProduct` which is not available here easily for ALL products.
    // Ideally, the cart items should ALREADY have the human-readable labels stored when added.
    // Let's assume we will refactor 'handleAddToCart' in App.jsx to save labels, 
    // OR we pass a helper that looks up based on item.productId.

    // For this refactor, let's import the product list to lookup.

    // Calculate total quantity for lead time
    const totalQuantity = cart.reduce((sum, item) => sum + parseInt(item.quantity || 0, 10), 0);

    const isValid = cart.length > 0 &&
        customer.name &&
        customer.phone && /^09\d{8}$/.test(customer.phone) &&
        customer.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) && // Basic with Regex
        (
            (customer.shippingMethod === 'store' && customer.storeName) ||
            (customer.shippingMethod === 'post' && customer.city && customer.district && customer.address) ||
            (customer.shippingMethod === 'pickup' && customer.pickupLocation && customer.pickupTime) ||
            (customer.shippingMethod === 'friend' && customer.friendName)
        );

    // If cart is empty
    if (cart.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 max-w-4xl text-center">
                <div className="mb-6">
                    <span className="text-6xl">🛒</span>
                </div>
                <h2 className="text-2xl font-bold text-wood-900 mb-4">購物車是空的</h2>
                <p className="text-wood-600 mb-8">看起來您還沒有選購任何商品。</p>
                <Link to="/">
                    <Button>前往逛逛</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
            <Link to="/" className="inline-flex items-center gap-2 text-wood-600 hover:text-wood-800 transition-colors">
                <ArrowLeft size={20} />
                繼續購物
            </Link>

            <h1 className="text-3xl font-serif font-bold text-wood-900 border-b border-wood-200 pb-4">
                結帳
            </h1>

            {/* Free Shipping Progress */}
            {!isFreeShipping && itemsTotal > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-center justify-between text-sm text-orange-800">
                    <span>再買 <span className="font-bold text-orange-600">${FREE_SHIPPING_THRESHOLD - itemsTotal}</span> 即可享免運優惠！</span>
                    <span className="text-xs bg-orange-200 px-2 py-1 rounded-full">差一點點</span>
                </div>
            )}
            {isFreeShipping && itemsTotal > 0 && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center justify-center gap-2 text-sm text-green-800">
                    <span className="bg-green-100 p-1 rounded-full">🎉</span>
                    <span className="font-bold">恭喜！您已符合免運資格</span>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-wood-100">
                <h3 className="text-lg font-serif font-bold text-wood-900 mb-4">
                    商品清單
                </h3>
                {/* 
                  OrderList expects 'getLabel'. 
                  Since we are now multi-product, 'OrderList' might need update or we pass a smart getLabel.
                  We will leave getLabel prop empty or handle it in App.jsx. 
                */}
                <OrderList
                    items={cart}
                    onEdit={onEdit}
                    onDelete={onDelete}
                // getLabel passed from App or handled inside
                />
                <div className="mt-6 pt-4 border-t border-wood-100 flex justify-between items-center text-lg font-bold text-wood-900">
                    <span>商品小計</span>
                    <span>{formatCurrency(itemsTotal)}</span>
                </div>
            </div>

            <CustomerInfo
                data={customer}
                onChange={onCustomerChange}
                onShippingCostChange={onShippingCostChange}
                isFreeShipping={isFreeShipping}
                totalQuantity={totalQuantity}
            />

            <div className="bg-wood-50 p-6 rounded-lg border border-wood-200">
                <div className="flex justify-between mb-2 text-wood-600">
                    <span>商品總計</span>
                    <span>{formatCurrency(itemsTotal)}</span>
                </div>
                <div className="flex justify-between mb-4 text-wood-600">
                    <span>運費 ({customer.shippingMethod === 'store' ? '超商' : customer.shippingMethod === 'post' ? '郵寄' : '自取'})</span>
                    <span>{isFreeShipping ? '免運' : formatCurrency(shippingCost)}</span>
                </div>
                    <span>{formatCurrency(itemsTotal + (isFreeShipping ? 0 : shippingCost))}</span>
                </div>
                {/* Estimated Date */}
                <div className="mt-4 pt-4 border-t border-wood-200 text-sm text-wood-700">
                    <div className="flex justify-between">
                        <span>預計出貨/取貨日期</span>
                        <span className="font-bold">
                            {customer.shippingMethod === 'pickup' && customer.pickupDate
                                ? customer.pickupDate
                                : (() => {
                                    const leadDays = calculateLeadDays(totalQuantity);
                                    const estDate = getEstimatedShipDate(leadDays);
                                    return `${estDate} (約 ${leadDays} 個工作天)`;
                                })()
                            }
                        </span>
                    </div>
                </div>
            </div>

            <Button
                size="lg"
                className="w-full text-lg py-6 shadow-md"
                onClick={onSubmit}
                disabled={!isValid || isSubmitting}
            >
                {isSubmitting ? '處理中...' : (
                    <span className="flex items-center gap-2">
                        <Send size={20} /> 確認送出訂單
                    </span>
                )}
            </Button>

            {
        !isValid && (
            <p className="text-center text-sm text-red-500">
                請填寫完整的訂購資訊以送出訂單
            </p>
        )
    }
        </div >
    );
}
