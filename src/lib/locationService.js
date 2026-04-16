import { supabase } from './supabaseClient';
import { uploadFile } from './storageService';

/** 前台/後台共用：取得所有地點（依排序） */
export async function fetchLocations({ onlyActive = false } = {}) {
    let query = supabase
        .from('class_locations')
        .select('*')
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: true });
    if (onlyActive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/** 取得單一地點 */
export async function fetchLocationById(id) {
    if (!id) return null;
    const { data, error } = await supabase
        .from('class_locations')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

export async function createLocation(payload) {
    const { data, error } = await supabase
        .from('class_locations')
        .insert([payload])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateLocation(id, payload) {
    const { data, error } = await supabase
        .from('class_locations')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteLocation(id) {
    const { error } = await supabase
        .from('class_locations')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

/** 上傳地點代表圖 */
export async function uploadLocationImage(file) {
    return uploadFile(file);
}

/** 地點類別中文標籤與顏色 class（供前後台共用） */
export const LOCATION_TYPE_META = {
    studio:    { label: '工作室',   bg: 'bg-maker-50',   text: 'text-maker-700',   ring: 'ring-maker-200' },
    partner:   { label: '合作單位', bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200' },
    library:   { label: '圖書館',   bg: 'bg-sky-50',     text: 'text-sky-700',     ring: 'ring-sky-200' },
    community: { label: '救國團',   bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-200' },
    online:    { label: '線上',     bg: 'bg-violet-50',  text: 'text-violet-700',  ring: 'ring-violet-200' },
    other:     { label: '其他',     bg: 'bg-gray-100',   text: 'text-gray-700',    ring: 'ring-gray-200' },
};

export const LOCATION_TYPE_OPTIONS = Object.entries(LOCATION_TYPE_META).map(([value, meta]) => ({
    value,
    label: meta.label,
}));
