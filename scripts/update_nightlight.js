import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Service Key missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const nightLightConfig = [
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
        label: '雕刻文字 (選填)',
        type: 'text',
        placeholder: '請輸入想雕刻的文字',
        required: false,
    },
    {
        name: 'customImage',
        label: '客製化圖檔',
        type: 'file',
        required: true,
    }
];

async function updateNightLight() {
    console.log('Updating Night Light config...');

    const { error } = await supabase
        .from('products')
        .update({ config_schema: nightLightConfig })
        .eq('slug', 'tile-night-light');

    if (error) {
        console.error('Error updating:', error);
    } else {
        console.log('Success! Night Light now has upload fields.');
    }
}

updateNightLight();
