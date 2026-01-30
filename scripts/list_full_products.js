import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listProducts() {
    console.log("--- Fetching Products ---");
    const { data, error } = await supabase.from('products').select('id, slug, name');
    if (error) {
        console.error(error);
    } else {
        data.forEach(p => {
            console.log(`[${p.id}] ${p.slug} (${p.name})`);
        });
    }
}
listProducts();
