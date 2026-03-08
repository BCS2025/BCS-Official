import { supabase } from './supabaseClient';

/**
 * Submits a custom quote request to the custom_quotes table.
 * @param {Object} quoteData The assembled quote data.
 * @returns {Promise<Object>} The inserted record.
 */
export async function submitCustomQuote(quoteData) {
    const { data, error } = await supabase
        .from('custom_quotes')
        .insert([quoteData])
        .select()
        .single();

    if (error) {
        console.error('Error submitting custom quote:', error);
        throw new Error(error.message || 'Failed to submit quote.');
    }

    return data;
}

// --- Quote Materials Management ---

export async function getQuoteMaterials() {
    const { data, error } = await supabase
        .from('quote_materials')
        .select('*')
        .order('method', { ascending: true })
        .order('sort_order', { ascending: false });

    if (error) throw error;
    return data;
}

export async function createQuoteMaterial(materialData) {
    const { data, error } = await supabase
        .from('quote_materials')
        .insert([materialData])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateQuoteMaterial(id, updates) {
    const { data, error } = await supabase
        .from('quote_materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteQuoteMaterial(id) {
    const { error } = await supabase
        .from('quote_materials')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
