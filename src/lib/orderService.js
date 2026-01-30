import { supabase } from './supabaseClient';

/**
 * Submits an order to the Supabase 'orders' table.
 */
export async function submitOrder(orderData) {
    const { data, error } = await supabase
        .from('orders')
        .insert([
            {
                order_id: orderData.orderId,
                user_info: orderData.customer,
                items: orderData.items,
                total_amount: orderData.totalAmount,
                status: 'pending'
            }
        ]); // Removed .select() to avoid RLS read error

    if (error) {
        console.error('Order Submission Error:', error);
        throw error;
    }

    return { id: 'submitted', ...orderData }; // Mock return since we can't read back the ID
}
