import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listProducts() {
    const { data, error } = await supabase.from('products').select('slug, name');
    if (error) console.error(error);
    else console.table(data);
}
listProducts();
