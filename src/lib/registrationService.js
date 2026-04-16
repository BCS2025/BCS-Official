import { supabase } from './supabaseClient';
import { notifyGAS } from './webhookService';

/**
 * 提交課程報名
 * 注意：需在 Supabase 後台為 registrations 表加入 public INSERT policy：
 *   CREATE POLICY "public insert" ON registrations FOR INSERT WITH CHECK (true);
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
    // 1. 寫入 registrations 表
    const { data, error } = await supabase
        .from('registrations')
        .insert([{
            course_id: courseId,
            parent_name: parentName,
            phone,
            email: email || null,
            child_age: childAge || null,
            note: note || null,
            status: 'confirmed',
        }])
        .select()
        .single();

    if (error) throw error;

    // 2. 更新課程報名人數與狀態
    const { data: course } = await supabase
        .from('courses')
        .select('enrolled, capacity')
        .eq('id', courseId)
        .single();

    if (course) {
        const newEnrolled = (course.enrolled || 0) + 1;
        const newStatus = newEnrolled >= course.capacity ? 'full' : 'open';
        await supabase
            .from('courses')
            .update({ enrolled: newEnrolled, status: newStatus })
            .eq('id', courseId);
    }

    // 3. GAS Webhook 通知（Email + Line）
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

    return data;
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
