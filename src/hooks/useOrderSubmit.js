import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../lib/storageService';
import { submitOrder as submitOrderService } from '../lib/orderService';
import { getProductLabel } from '../lib/productService';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/pricing';
import { calculateLeadDays, getEstimatedShipDate } from '../lib/utils';
import { notifyGAS } from '../lib/webhookService';
import { initiatePayment, PAYMENT_METHODS } from '../lib/paymentService';
import { MESSAGES } from '../constants/messages';
import { getProofItems } from '../lib/cartHelpers';

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
        freeShippingThreshold,
        products,
        couponData = {},
        paymentMethod = PAYMENT_METHODS.BANK_TRANSFER,
        onSuccess,
    }) => {
        const { couponCode, discountAmount = 0 } = couponData;
        const finalTotal = Math.max(0, itemsTotal - discountAmount + finalShippingCost);

        const paymentLabel = paymentMethod === PAYMENT_METHODS.LINE_PAY ? 'LINE Pay' : '銀行轉帳';
        let confirmMsg = `確定要送出訂單嗎？\n\n付款方式: ${paymentLabel}\n商品總計: ${formatCurrency(itemsTotal)}`;
        if (discountAmount > 0) confirmMsg += `\n優惠折抵: -${formatCurrency(discountAmount)}`;
        if (finalShippingCost > 0) {
            confirmMsg += `\n運費: ${formatCurrency(finalShippingCost)}`;
        } else if (isFreeShipping && shippingCost > 0) {
            const thresholdLabel = freeShippingThreshold ? `滿$${freeShippingThreshold}活動` : '滿額活動';
            confirmMsg += `\n運費: 免運 (${thresholdLabel})`;
        } else if (couponCode && finalShippingCost === 0 && !isFreeShipping) {
            confirmMsg += `\n運費: 免運 (優惠碼)`;
        }
        confirmMsg += `\n----------------\n總金額: ${formatCurrency(finalTotal)}`;
        if (paymentMethod === PAYMENT_METHODS.LINE_PAY) {
            confirmMsg += `\n\n送出後將導向 LINE Pay 付款頁面`;
        }

        if (!confirm(confirmMsg)) return;

        setIsSubmitting(true);
        try {
            // 1. Upload files（跳過 proofFileLater === true 的 proofFile）
            const processedItems = await Promise.all(cart.map(async (item) => {
                const newItem = { ...item };
                for (const key of Object.keys(newItem)) {
                    if (newItem[key] instanceof File) {
                        // 客戶選擇稍後透過 LINE 補檔 → 不上傳，保留 null + 標記
                        if (key === 'proofFile' && newItem.proofFileLater === true) {
                            newItem[key] = null;
                            continue;
                        }
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
            // 對稿三值化：無對稿商品 → 'na'；有對稿商品 → 沿用客戶選擇（預設 yes）
            const hasProofItems = getProofItems(cart, products).length > 0;
            const hasLateUpload = processedItems.some(it => it.proofFileLater === true);
            const needProof = !hasProofItems ? 'na' : (customer.needProof || 'yes');
            const totalQuantity = cart.reduce((sum, item) => sum + parseInt(item.quantity || 0, 10), 0);
            const leadDays = calculateLeadDays(totalQuantity);
            const estimatedDate = customer.shippingMethod === 'pickup'
                ? customer.pickupDate
                : getEstimatedShipDate(leadDays);

            const isHomeShipping = customer.shippingMethod === 'tcat' || customer.shippingMethod === 'post';
            const composedAddress = isHomeShipping
                ? `${customer.city || ''}${customer.district || ''}${customer.address || ''}`
                : customer.address;

            // 對應綠界 LogisticsSubType
            //  - C2C 賣貨便：UNIMARTC2C / FAMIC2C / HILIFEC2C / OKMARTC2C（從 cvsStoreBrand 帶）
            //  - 黑貓宅配：TCAT
            //  - 中華郵政：POST
            //  - 自取：null（不建立綠界物流單）
            const logisticsSubType =
                customer.shippingMethod === 'store' ? (customer.cvsStoreBrand || null) :
                customer.shippingMethod === 'tcat'  ? 'TCAT' :
                customer.shippingMethod === 'post'  ? 'POST' :
                null;

            const orderData = {
                orderId,
                timestamp: new Date().toISOString(),
                estimatedDate,
                customer: {
                    ...customer,
                    needProof,
                    shippingCost: finalShippingCost,
                    address: composedAddress,
                    // cellPhone 給後端 createLogisticsOrder 用（user_info.cellPhone 為主）
                    cellPhone: customer.phone,
                },
                items: processedItems,
                totalAmount: finalTotal,
                couponCode,
                discountAmount,
                totalQuantity,
                status: 'pending',
                paymentMethod,
                logisticsSubType,
                cvsStore: customer.shippingMethod === 'store' ? {
                    id: customer.cvsStoreId,
                    name: customer.cvsStoreName,
                    address: customer.cvsStoreAddress,
                    brand: customer.cvsStoreBrand,
                } : null,
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

            // 4. GAS webhook — order notification（訂單建立時先發一次）
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
            setSuccessData({ orderId, needProof, estimatedDate, totalAmount: finalTotal, paymentMethod, hasProofItems, hasLateUpload });
            onSuccess?.();

            if (paymentMethod === PAYMENT_METHODS.LINE_PAY) {
                // 導向 LINE Pay：先呼叫 /api/linepay/request 取得 paymentUrl
                try {
                    const { redirectUrl } = await initiatePayment({ orderId, paymentMethod });
                    if (!redirectUrl) throw new Error('LINE Pay 未回傳付款網址');
                    window.location.href = redirectUrl;
                    return;
                } catch (err) {
                    console.error('LINE Pay initiatePayment failed:', err);
                    alert(`建立 LINE Pay 付款失敗：${err.message}\n\n訂單已成立，您可稍後在「待付款訂單」重試，或改用銀行轉帳。`);
                    navigate('/store/thank-you');
                    return;
                }
            }

            navigate('/store/thank-you');

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
