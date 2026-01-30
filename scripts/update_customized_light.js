import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const customizedNightLightConfig = [
    {
        name: 'lightBase',
        label: '底座款式',
        type: 'select',
        options: [
            { value: 'warm', label: '溫馨黃光' },
            { value: 'white', label: '明亮白光' },
        ],
        defaultValue: 'warm',
    },
    {
        name: 'customText',
        label: '雕刻文字',
        type: 'text',
        placeholder: '請輸入文字',
        required: true,
    },
    {
        name: 'customImage',
        label: '客製化圖檔',
        type: 'file',
        required: true,
    }
];

async function updateCustomizedLight() {
    console.log('Searching for "客製化小夜燈"...');

    // Find by Name pattern since Slug might be tricky
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .ilike('name', '%客製化小夜燈%');

    if (!products || products.length === 0) {
        console.error('Error: Could not find product with name matching "客製化小夜燈"');
        return;
    }

    const targetProduct = products[0];
    console.log(`Found product: ${targetProduct.name} (Slug: ${targetProduct.slug}, ID: ${targetProduct.id})`);

    const { error } = await supabase
        .from('products')
        .update({ config_schema: customizedNightLightConfig })
        .eq('id', targetProduct.id);

    if (error) {
        console.error('Update Failed:', error);
    } else {
        console.log('Update Success! Schema applied.');
    }
}

updateCustomizedLight();
