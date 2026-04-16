import { supabase } from './supabaseClient';

/**
 * Uploads a file to the 'order-uploads' bucket.
 * Returns the public URL (or path) to be stored in the order.
 */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function uploadFile(file) {
    if (!file) return null;

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`檔案大小不能超過 10MB（目前 ${(file.size / 1024 / 1024).toFixed(1)}MB）`);
    }

    // Generate a unique file path: timestamp_random_filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
        .from('order-uploads')
        .upload(filePath, file);

    if (error) {
        console.error('Upload Error:', error);
        throw error;
    }

    // Get Public URL
    const { data: publicUrlData } = supabase.storage
        .from('order-uploads')
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
}
