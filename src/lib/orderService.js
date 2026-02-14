import { supabase } from './supabaseClient';

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
        const messages = validationErrors.map(e => `• ${e.product_name}: ${e.reason}`).join('\n');
        throw new Error(`庫存不足，無法結帳：\n${messages}`);
    }

    // 2. SUBMIT ORDER
    const { data, error } = await supabase
        .from('orders')
        .insert([
            {
                order_id: orderData.orderId,
                user_info: orderData.customer,
                items: orderData.items,
                total_amount: orderData.totalAmount,
                coupon_code: orderData.couponCode || null,
                discount_amount: orderData.discountAmount || 0,
                status: 'pending'
            }
        ]); // Removed .select() to avoid RLS read error

    if (error) {
        console.error('Order Submission Error:', error);
        // Translate DB Constraint Error to User Friendly Message
        if (error.message?.includes('check_positive_stock') || error.details?.includes('check_positive_stock')) {
            throw new Error('庫存不足！有商品已被搶購一空，請檢查購物車數量。');
        }
        throw error;
    }

    return { id: 'submitted', ...orderData }; // Mock return since we can't read back the ID
}
