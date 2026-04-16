import { supabase } from './supabaseClient';

// ─── Portfolio CRUD ───────────────────────────────────────────

export async function fetchPortfolio() {
    const { data, error } = await supabase
        .from('forge_portfolio')
        .select('*')
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function createPortfolioItem(item) {
    const { data, error } = await supabase
        .from('forge_portfolio')
        .insert([item])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updatePortfolioItem(id, updates) {
    const { data, error } = await supabase
        .from('forge_portfolio')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deletePortfolioItem(id) {
    const { error } = await supabase
        .from('forge_portfolio')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

export async function uploadPortfolioImage(file) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = `portfolio/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const { error } = await supabase.storage.from('forge-portfolio').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('forge-portfolio').getPublicUrl(path);
    return data.publicUrl;
}
