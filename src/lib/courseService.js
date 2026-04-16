import { supabase } from './supabaseClient';
import { uploadFile } from './storageService';

/** 取得所有課程（前台：依日期升冪） */
export async function fetchCourses() {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('date', { ascending: true });
    if (error) throw error;
    return data;
}

/** 取得單一課程 */
export async function fetchCourseById(id) {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

/** 新增課程（Admin） */
export async function createCourse(payload) {
    const { data, error } = await supabase
        .from('courses')
        .insert([payload])
        .select()
        .single();
    if (error) throw error;
    return data;
}

/** 更新課程（Admin） */
export async function updateCourse(id, payload) {
    const { data, error } = await supabase
        .from('courses')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/** 刪除課程（Admin） */
export async function deleteCourse(id) {
    const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

/** 上傳課程圖片（封面或課堂照），回傳公開 URL */
export async function uploadCourseImage(file) {
    return uploadFile(file);
}
