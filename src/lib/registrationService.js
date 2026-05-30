import { supabase } from './supabaseClient';
import { notifyGAS } from './webhookService';

/**
 * 提交課程報名
 * 透過 SECURITY DEFINER RPC submit_course_registration 完成：
 *   一次處理「寫入報名 + 累加課程人數」，訪客(anon)不需對 registrations / courses 有直接寫入權限。
 * 對應 migration：supabase/migrations/20260531_registration_rpc.sql
 */
export async function createRegistration({
    courseId,
    courseTitle,
    courseDate,
    parentName,
    phone,
    email,
    childAge,
    note,
}) {
    // 1. 透過 RPC 寫入報名 + 更新課程人數（以 definer 權限安全執行）
    const { data, error } = await supabase.rpc('submit_course_registration', {
        p_course_id: courseId,
        p_parent_name: parentName,
        p_phone: phone,
        p_email: email || null,
        p_child_age: childAge || null,
        p_note: note || null,
    });

    if (error) throw error;

    // 2. GAS Webhook 通知（Email + Line）。notifyGAS 內部已處理失敗，不會 throw。
    await notifyGAS({
        type: 'registration',
        courseTitle,
        courseDate,
        parentName,
        phone,
        email,
        childAge,
        note,
    }, 'registration_notify');

    return data; // 新報名的 id
}

/** 取得報名紀錄（Admin），可選依課程篩選 */
export async function fetchRegistrations(courseId = null) {
    let query = supabase
        .from('registrations')
        .select('*, courses(title, date)')
        .order('created_at', { ascending: false });

    if (courseId) {
        query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/** 更新報名狀態（Admin）：confirmed / attended / absent / cancelled */
export async function updateRegistrationStatus(id, status) {
    const { error } = await supabase
        .from('registrations')
        .update({ status })
        .eq('id', id);
    if (error) throw error;
}
