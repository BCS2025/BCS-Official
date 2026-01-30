import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const tileNightLightConfig = [
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
        name: 'style',
        label: '款式',
        type: 'select',
        options: [
            { value: 'style1', label: '款式一' },
            { value: 'style2', label: '款式二' },
        ],
        defaultValue: 'style1',
    }
];

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

async function fixSchemas() {
    console.log('Fixing Product Schemas...');

    // 1. Revert Tile Night Light
    await supabase.from('products')
        .update({ config_schema: tileNightLightConfig })
        .eq('slug', 'tile-night-light');
    console.log(' - Reverted Tile Night Light');

    // 2. Update Customized Night Light
    // NOTE: I am guessing the slug is 'customized-night-light' based on pattern. 
    // If list_slugs output differs, I will adjust. 
    // But waiting for async output is slow. I'll bet on the standard slug or check output first?
    // Let's check output first.

    // Actually, I'll fetch the list dynamically here to be safe
    const { data: products } = await supabase.from('products').select('slug, name');
    const customLight = products.find(p => p.name.includes('客製化小夜燈'));

    if (customLight) {
        console.log(` - Found Customized Light: ${customLight.slug}`);
        await supabase.from('products')
            .update({ config_schema: customizedNightLightConfig })
            .eq('id', customLight.id) // safer to use internal ID if we have the row
            .or(`slug.eq.${customLight.slug}`);
    } else {
        console.error(' - Could not find Customized Night Light!');
    }
}

fixSchemas();
