import { useState } from 'react';
import { Link } from 'react-router-dom';
import OrderList from './OrderList';
import CustomerInfo from './CustomerInfo';
import ProductForm from './ProductForm';
import { Button } from './ui/Button';
import { Send, ArrowLeft, X } from 'lucide-react';
import { formatCurrency } from '../lib/pricing';
import { calculateLeadDays, getEstimatedShipDate } from '../lib/utils';
import { getProductById } from '../data/products';
import { couponService } from '../lib/couponService'; // New Coupon Service
import { Input } from './ui/Input';
import { Loader2 } from 'lucide-react';

export default function Cart({
    cart,
    products,
    customer,
    shippingCost,
    onUpdateItem, // Changed from onEdit
    onDelete,
    onCustomerChange,
    onShippingCostChange,
    onSubmit,
    isSubmitting,
    isFreeShipping,
    FREE_SHIPPING_THRESHOLD,
    itemsTotal
}) {
    const [editingItem, setEditingItem] = useState(null);

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

    // Calculate total quantity for lead time
    const totalQuantity = cart.reduce((sum, item) => sum + parseInt(item.quantity || 0, 10), 0);

    // --- Coupon Logic ---
    const calculateDiscount = () => {
        if (!appliedCoupon) return 0;

        let discount = 0;
        const subtotal = itemsTotal;

        // 1. Validate Min Spend
        if (appliedCoupon.min_spend > 0 && subtotal < appliedCoupon.min_spend) {
            return 0; // Or better: auto-remove or show warning? For simplified logic: 0 discount but keep code
        }

        switch (appliedCoupon.discount_type) {
            case 'percentage':
                // target_type check
                if (appliedCoupon.target_type === 'product_specific') {
                    // Apply to specific items
                    const eligibleItems = cart.filter(item => appliedCoupon.target_product_ids.includes(item.productId));
                    const eligibleTotal = eligibleItems.reduce((sum, item) => sum + item.price, 0);
                    discount = Math.round(eligibleTotal * (appliedCoupon.value / 100));
                } else {
                    // All items
                    discount = Math.round(subtotal * (appliedCoupon.value / 100));
                }
                break;
            case 'fixed_amount':
                // Fixed amount off entire order (simple)
                discount = appliedCoupon.value;
                break;
            case 'free_shipping':
                // Handled in total calculation, returns 0 here or we treat shipping as discount?
                // Standard practice: "Discount" usually refers to item discount. Shipping discount is separate.
                // However, for totalAmount calculation, we need to know.
                // Let's handle free_shipping by overriding shippingCost logic below.
                return 0;
        }

        // Cap discount at subtotal
        return Math.min(discount, subtotal);
    };

    const discountAmount = calculateDiscount();

    // Shipping Logic with Coupon
    const isCouponFreeShipping = appliedCoupon?.discount_type === 'free_shipping';
    const effectiveShippingCost = (isFreeShipping || isCouponFreeShipping) ? 0 : shippingCost;

    const finalTotal = Math.max(0, itemsTotal - discountAmount + effectiveShippingCost);

    const activeCouponDisplay = appliedCoupon && (!appliedCoupon.min_spend || itemsTotal >= appliedCoupon.min_spend) ? appliedCoupon : null;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidatingCoupon(true);
        setCouponError(null);

        try {
            const result = await couponService.validate(couponCode);
            if (!result.valid) {
                setCouponError(result.reason || '無效的優惠碼');
                setAppliedCoupon(null);
            } else {
                // Check min spend immediately
                if (result.min_spend > 0 && itemsTotal < result.min_spend) {
                    setCouponError(`未達最低消費門檻 $${result.min_spend}`);
                    setAppliedCoupon(null);
                } else {
                    setAppliedCoupon(result);
                    setCouponCode(''); // Clear input on success? Or keep it? Usually keep to show what's applied.
                    // Actually clearer to clear input and show "Applied: CODE" badge.
                }
            }
        } catch (err) {
            console.error(err);
            setCouponError('驗證失敗，請稍後再試');
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError(null);
    };

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
                    products={products}
                    onEdit={setEditingItem}
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

            {/* Coupon Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-wood-100">
                <h3 className="text-lg font-serif font-bold text-wood-900 mb-4">
                    優惠代碼
                </h3>

                {activeCouponDisplay ? (
                    <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded text-green-800">
                        <div className="flex items-center gap-2">
                            <span className="font-bold bg-green-200 px-2 py-0.5 rounded text-xs">
                                {activeCouponDisplay.code}
                            </span>
                            <span className="text-sm">
                                {activeCouponDisplay.discount_type === 'free_shipping' ? '已折抵運費' : `已折抵 ${formatCurrency(discountAmount)}`}
                            </span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={handleRemoveCoupon} className="text-red-500 hover:text-red-700 h-8 w-8 p-0">
                            <X size={18} />
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2 items-start">
                        <div className="flex-1">
                            <Input
                                placeholder="請輸入優惠碼"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                disabled={isValidatingCoupon}
                                error={couponError}
                            />
                        </div>
                        <Button
                            onClick={handleApplyCoupon}
                            disabled={!couponCode || isValidatingCoupon}
                            variant="outline"
                            className="bg-wood-50 hover:bg-wood-100"
                        >
                            {isValidatingCoupon ? <Loader2 className="animate-spin w-4 h-4" /> : '套用'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-wood-50 p-6 rounded-lg border border-wood-200">
                <div className="flex justify-between mb-2 text-wood-600">
                    <span>商品總計</span>
                    <span>{formatCurrency(itemsTotal)}</span>
                </div>

                {/* Discount Line Item */}
                {appliedCoupon && discountAmount > 0 && (
                    <div className="flex justify-between mb-2 text-green-600 font-bold">
                        <span>優惠折抵 ({appliedCoupon.code})</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                )}

                <div className="flex justify-between mb-4 text-wood-600">
                    <span>運費 ({customer.shippingMethod === 'store' ? '超商' : customer.shippingMethod === 'post' ? '郵寄' : '自取'})</span>
                    <span className={isFreeShipping || isCouponFreeShipping ? "text-red-500 font-bold" : ""}>
                        {isFreeShipping || isCouponFreeShipping ? '免運' : formatCurrency(shippingCost)}
                    </span>
                </div>
                <div className="border-t border-wood-200 pt-4 flex justify-between text-xl font-bold text-wood-900">
                    <span>結帳總金額</span>
                    <span>{formatCurrency(finalTotal)}</span>
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
                onClick={() => onSubmit({
                    couponCode: appliedCoupon?.code,
                    discountAmount,
                    // Pass applied coupon details if needed for record
                    appliedCoupon
                })}
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

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="absolute top-4 right-4 z-10">
                            <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)} className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-wood-100">
                                <X size={20} />
                            </Button>
                        </div>
                        <div className="p-1">
                            <ProductForm
                                product={products.find(p => p.id === editingItem.productId)}
                                initialData={editingItem}
                                onAddToCart={(updatedItem) => {
                                    onUpdateItem(updatedItem);
                                    setEditingItem(null);
                                }}
                                onCancelEdit={() => setEditingItem(null)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
