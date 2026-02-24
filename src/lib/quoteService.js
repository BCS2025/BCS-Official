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
