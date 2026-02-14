import { supabase } from './supabaseClient';

export const couponService = {
    // --- Admin: CRUD ---
    async getAll() {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(couponData) {
        const { data, error } = await supabase
            .from('coupons')
            .insert([couponData])
            .select();
        if (error) throw error;
        return data[0];
    },

    async update(code, updates) {
        const { data, error } = await supabase
            .from('coupons')
            .update(updates)
            .eq('code', code)
            .select();
        if (error) throw error;
        return data[0];
    },

    async delete(code) {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('code', code);
        if (error) throw error;
    },

    // --- Public: Validation ---
    async validate(code) {
        // Use RPC for security (prevents dumping the whole coupon table)
        const { data, error } = await supabase.rpc('validate_coupon', { p_code: code });

        if (error) throw error;

        // data structure: { valid: boolean, reason?: string, ...couponDetails }
        return data;
    },

    // --- Public: Usage Tracking ---
    async incrementUsage(code) {
        const { error } = await supabase.rpc('increment_coupon_usage', { p_code: code });
        if (error) console.error('Failed to increment coupon usage:', error);
    }
};

export function generateRandomCode(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 1, 0 to avoid confusion
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
