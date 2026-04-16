import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../lib/storageService';
import { submitOrder as submitOrderService } from '../lib/orderService';
import { getProductLabel } from '../lib/productService';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/pricing';
import { calculateLeadDays, getEstimatedShipDate } from '../lib/utils';
import { notifyGAS } from '../lib/webhookService';
import { MESSAGES } from '../constants/messages';

export function useOrderSubmit() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);

    const submitOrder = async ({
        cart,
        customer,
        itemsTotal,
        finalShippingCost,
        isFreeShipping,
        shippingCost,
        FREE_SHIPPING_THRESHOLD,
        products,
        couponData = {},
        onSuccess,
    }) => {
        const { couponCode, discountAmount = 0 } = couponData;
        const finalTotal = Math.max(0, itemsTotal - discountAmount + finalShippingCost);

        // Build confirmation message
        let confirmMsg = `確定要送出訂單嗎？\n\n商品總計: ${formatCurrency(itemsTotal)}`;
        if (discountAmount > 0) confirmMsg += `\n優惠折抵: -${formatCurrency(discountAmount)}`;
        if (finalShippingCost > 0) {
            confirmMsg += `\n運費: ${formatCurrency(finalShippingCost)}`;
        } else if (isFreeShipping && shippingCost > 0) {
            confirmMsg += `\n運費: 免運 (滿$${FREE_SHIPPING_THRESHOLD}活動)`;
        } else if (couponCode && finalShippingCost === 0 && !isFreeShipping) {
            confirmMsg += `\n運費: 免運 (優惠碼)`;
        }
        confirmMsg += `\n----------------\n總金額: ${formatCurrency(finalTotal)}`;

        if (!confirm(confirmMsg)) return;

        setIsSubmitting(true);
        try {
            // 1. Upload files
            const processedItems = await Promise.all(cart.map(async (item) => {
                const newItem = { ...item };
                for (const key of Object.keys(newItem)) {
                    if (newItem[key] instanceof File) {
                        try {
                            const publicUrl = await uploadFile(newItem[key]);
                            newItem[`${key}_filename`] = newItem[key].name;
                            newItem[key] = publicUrl;
                        } catch (err) {
                            console.error(`Failed to upload file for item ${item.productName}:`, err);
                            throw new Error(MESSAGES.UPLOAD.FAILED);
                        }
                    }
                }
                return newItem;
            }));

            const orderId = `ORD-${Date.now().toString().slice(-6)}`;
            const needProof = customer.needProof || 'yes';
            const totalQuantity = cart.reduce((sum, item) => sum + parseInt(item.quantity || 0, 10), 0);
            const leadDays = calculateLeadDays(totalQuantity);
            const estimatedDate = customer.shippingMethod === 'pickup'
                ? customer.pickupDate
                : getEstimatedShipDate(leadDays);

            const orderData = {
                orderId,
                timestamp: new Date().toISOString(),
                estimatedDate,
                customer: {
                    ...customer,
                    needProof,
                    shippingCost: finalShippingCost,
                    address: customer.shippingMethod === 'post'
                        ? `${customer.city}${customer.district}${customer.address}`
                        : customer.address,
                },
                items: processedItems,
                totalAmount: finalTotal,
                couponCode,
                discountAmount,
                totalQuantity,
                status: 'pending',
            };

            // 2. Build human-readable items for email/LINE notification
            const readableItems = processedItems.map(item => {
                const product = products.find(p => p.id === item.productId);
                const readableItem = { ...item };
                Object.keys(item).forEach(key => {
                    const label = getProductLabel(products, item.productId, key, item[key]);
                    if (label !== item[key]) readableItem[key] = label;
                });
                if (product) readableItem.productName = product.name;
                return readableItem;
            });

            // 3. Submit to Supabase
            await submitOrderService(orderData);

            // 4. GAS webhook — order notification
            notifyGAS({ ...orderData, items: readableItems }, 'order_notify');

            // 5. Low stock alert
            try {
                const { data: criticalMaterials, error: rpcError } = await supabase.rpc('check_low_stock');
                if (rpcError) throw rpcError;

                if (criticalMaterials?.length > 0) {
                    const outOfStock = criticalMaterials.filter(m => m.current_stock <= 0);
                    const lowStock = criticalMaterials.filter(m => m.current_stock > 0);

                    let alertMessage = `⚠️ 庫存警報通知 (Inventory Alert)\n`;
                    if (outOfStock.length > 0) {
                        alertMessage += `\n⛔ 庫存用罄 (Out of Stock):\n${outOfStock.map(m =>
                            `- ${m.name}: 剩餘 ${m.current_stock} (安全量: ${m.safety_stock})`
                        ).join('\n')}\n`;
                    }
                    if (lowStock.length > 0) {
                        alertMessage += `\n⚠️ 庫存告急 (Low Stock):\n${lowStock.map(m =>
                            `- ${m.name}: 剩餘 ${m.current_stock} (安全量: ${m.safety_stock})`
                        ).join('\n')}`;
                    }

                    notifyGAS({ type: 'system_alert', message: alertMessage }, 'low_stock_alert');
                }
            } catch (err) {
                console.error('Failed to check low stock:', err);
            }

            // 6. Success
            setSuccessData({ orderId, needProof, estimatedDate, totalAmount: finalTotal });
            onSuccess?.();
            navigate('/thank-you');

        } catch (error) {
            console.error('Error submitting order:', error);
            alert(error.message || MESSAGES.ORDER.SUBMIT_FAILED);
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearSuccessData = () => setSuccessData(null);

    return { submitOrder, isSubmitting, successData, clearSuccessData };
}
