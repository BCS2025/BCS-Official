import { supabase } from './supabaseClient';
import { MESSAGES } from '../constants/messages';

/**
 * Submits an order to the Supabase 'orders' table.
 */
export async function submitOrder(orderData) {
    // 1. PRE-FLIGHT CHECK: Detailed Validation
    const { data: validationErrors, error: valError } = await supabase
        .rpc('validate_cart_stock', {
            p_cart_items: orderData.items
        });

    if (valError) {
        console.error('Validation RPC Error:', valError);
        // Fallback: Proceed to try insert anyway if RPC fails (network/code issue), let constraints handle it
    } else if (validationErrors && validationErrors.length > 0) {
        // Validation Failed - Construct detailed message
        const lines = validationErrors.map(e => `• ${e.product_name}: ${e.reason}`).join('\n');
        throw new Error(MESSAGES.ORDER.STOCK_DETAIL(lines));
    }

    // 2. SUBMIT ORDER
    const cvsStore = orderData.cvsStore || null;
    const insertRow = {
        order_id: orderData.orderId,
        user_info: orderData.customer,
        items: orderData.items,
        total_amount: orderData.totalAmount,
        coupon_code: orderData.couponCode || null,
        discount_amount: orderData.discountAmount || 0,
        status: 'pending',
        payment_method: orderData.paymentMethod || 'bank_transfer',
        payment_status: 'pending',
        // 物流欄位（給綠界建單用）
        logistics_sub_type: orderData.logisticsSubType || null,
        cvs_store_id: cvsStore?.id || null,
        cvs_store_name: cvsStore?.name || null,
        cvs_store_address: cvsStore?.address || null,
        cvs_store_brand: cvsStore?.brand || null,
    };

    const { data, error } = await supabase
        .from('orders')
        .insert([insertRow]); // Removed .select() to avoid RLS read error

    if (error) {
        console.error('Order Submission Error:', error);
        // Translate DB Constraint Error to User Friendly Message
        if (error.message?.includes('check_positive_stock') || error.details?.includes('check_positive_stock')) {
            throw new Error(MESSAGES.ORDER.STOCK_INSUFFICIENT);
        }
        throw error;
    }

    return { id: 'submitted', ...orderData }; // Mock return since we can't read back the ID
}
