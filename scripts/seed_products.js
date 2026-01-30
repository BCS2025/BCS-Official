import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
    console.error('Note: The "service_role" key is required to bypass RLS policies for seeding data.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Data from your src/data/products.js mapped to the new DB Schema
const productsToInsert = [
    {
        slug: 'wooden-keychain',
        name: '客製化木質鑰匙圈',
        price: 99,
        image_url: '/product-thumbnails/image%20thumbnail_客製化鑰匙圈.png',
        description: '獨一無二的專屬訂製，溫潤手感，送禮自用兩相宜。',
        price_description: '單面 $99 / 雙面 $150 (滿50個同內容享量販價)',
        // Mapping the 'fields' array to config_schema
        config_schema: [
            {
                name: 'siding',
                label: '雕刻面數',
                type: 'select',
                options: [
                    { value: 'single', label: '單面雕刻 ($99)' },
                    { value: 'double', label: '雙面雕刻 ($150)' },
                ],
                defaultValue: 'single',
            },
            {
                name: 'shape',
                label: '款式選擇',
                type: 'select',
                options: [
                    { value: 'style1', label: '款式 1 (圓形)', image: '/wood-keychain-thumbnails/鑰匙圈版型_圓形.png' },
                    { value: 'style2', label: '款式 2 (心形)', image: '/wood-keychain-thumbnails/鑰匙圈版型_心形.png' },
                    { value: 'style3', label: '款式 3 (矩形)', image: '/wood-keychain-thumbnails/鑰匙圈版型_矩形.png' },
                    { value: 'style4', label: '款式 4 (盾牌)', image: '/wood-keychain-thumbnails/鑰匙圈版型_盾牌形.png' },
                    { value: 'style5', label: '款式 5 (正方形)', image: '/wood-keychain-thumbnails/鑰匙圈版型_正方形.png' },
                ],
                defaultValue: 'style1',
            },
            {
                name: 'font',
                label: '字體選擇',
                type: 'select',
                options: [
                    { value: 'lishu', label: '隸書體', image: '/wood-keychain-thumbnails/鑰匙圈字體_隸書體.png' },
                    { value: 'kai', label: '楷體', image: '/wood-keychain-thumbnails/鑰匙圈字體_楷體.png' },
                    { value: 'fangsong', label: '仿宋體', image: '/wood-keychain-thumbnails/鑰匙圈字體_仿宋體.png' },
                    { value: 'yicai', label: '逸彩體', image: '/wood-keychain-thumbnails/鑰匙圈字體_逸彩體.png' },
                    { value: 'xingcao', label: '行草', image: '/wood-keychain-thumbnails/鑰匙圈字體_行草.png' },
                ],
                defaultValue: 'lishu',
            },
            {
                name: 'textFront',
                label: '正面文字 (10字內)',
                type: 'text',
                maxLength: 10,
                placeholder: '請輸入正面文字',
                required: true,
            },
            {
                name: 'textBack',
                label: '背面文字 (10字內)',
                type: 'text',
                maxLength: 10,
                placeholder: '請輸入背面文字',
                condition_logic: { field: 'siding', value: 'double' }, // Converted function to JSON logic representation
            },
        ],
        pricing_logic: {
            type: 'keychain',
            base: 99,
            double_sided_price: 150
        }
    },
    {
        slug: 'tile-night-light',
        name: '花磚小夜燈',
        price: 590,
        image_url: '/product-thumbnails/image%20thumbnail_花磚小夜燈.png',
        description: '復古花磚圖騰，結合現代工藝的優雅家飾。',
        price_description: '$590 / 個',
        config_schema: [],
        pricing_logic: { type: 'simple', multipler: 1 }
    },
    {
        slug: 'spring-couplets',
        name: '立體春聯',
        price: 399,
        image_url: '/product-thumbnails/image%20thumbnail_立體春聯.png',
        description: '創意立體設計，為傳統節日增添現代美感。',
        detailed_description: `🔍 **產品特色**\n✔ **雙層設計｜立體視覺更有層次**\n✔ **手工製作｜細緻工藝提升整體質感**\n✔ **雷射切割｜線條俐落、精準立體**\n✔ **三款字樣可選｜福 / 財 / 發，自由搭配吉祥寓意**\n✔ **輕巧材質｜方便懸掛於門上、牆面、櫃子上皆適宜**\n\n---\n📐 **商品規格**\n・尺寸：12cm x 12cm\n・總厚度：約5.7mm（每片板材約2.85mm）\n・材質：環保植纖板\n・款式：福 / 財 / 發（單售）\n・製作方式：雷射切割 + 手工組裝\n\n---\n🏠 **適用場景**\n・大門、房門、櫃子、玄關裝飾\n・年節佈置、開運擺飾、公司行號迎春布置\n・送禮自用兩相宜，年節贈禮別出心裁！\n\n---\n💡 **小提醒**\n・商品為手工製作，每件略有差異屬正常現象。\n・可搭配無痕膠條或雙面膠固定於平滑表面（出貨不含黏貼工具）。\n\n---\n✨ **讓「福」「財」「發」為你開啟一整年的好運！**\n立即選購比創空間手作立體春聯，讓家中洋溢新年氛圍與滿滿喜氣！`,
        price_description: '$399 / 個',
        config_schema: [
            {
                name: 'shape',
                label: '款式選擇',
                type: 'select',
                options: [
                    { value: 'fu', label: '福氣滿滿滿 (福)', image: '/3D_Spring_Couplets_thumbnails/image%20thumbnail_福.png' },
                    { value: 'cai', label: '財源滾滾來 (財)', image: '/3D_Spring_Couplets_thumbnails/image%20thumbnail_財.png' },
                    { value: 'fa', label: '好運發發發 (發)', image: '/3D_Spring_Couplets_thumbnails/image%20thumbnail_發.png' },
                ],
                defaultValue: 'fu',
            },
        ],
        pricing_logic: { type: 'simple', multipler: 1 }
    },
    {
        slug: 'wooden-coaster',
        name: '客製化原木杯墊',
        price: 290,
        image_url: '/product-thumbnails/image%20thumbnail_客製化原木杯墊.png',
        description: '天然原木紋理，雷射雕刻專屬圖樣。',
        price_description: '$290 / 個',
        config_schema: [],
        pricing_logic: { type: 'simple', multipler: 1 }
    },
    {
        slug: 'tile-calendar',
        name: '花磚月曆',
        price: 690,
        image_url: '/product-thumbnails/image%20thumbnail_花磚月曆.png',
        description: '實用與美感兼具，紀錄生活的美好時刻。',
        price_description: '$690 / 個',
        config_schema: [],
        pricing_logic: { type: 'simple', multipler: 1 }
    },
    {
        slug: 'night-light',
        name: '客製化小夜燈',
        price: 490,
        image_url: '/product-thumbnails/image%20thumbnail_客製化小夜燈.png',
        description: '溫馨暖光，點亮您的每一個夜晚。',
        price_description: '$490 / 個',
        config_schema: [],
        pricing_logic: { type: 'simple', multipler: 1 }
    }
];

async function seedProducts() {
    console.log('--- Starting Migration ---');

    for (const product of productsToInsert) {
        console.log(`Migrating: ${product.name}...`);

        // Check if exists
        const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('slug', product.slug)
            .single();

        if (existing) {
            console.log(`  -> Product ${product.slug} already exists. Updating...`);
            const { error } = await supabase
                .from('products')
                .update(product)
                .eq('id', existing.id);

            if (error) console.error(`  -> Error updating:`, error.message);
            else console.log(`  -> Update success.`);
        } else {
            console.log(`  -> Creating new product...`);
            const { error } = await supabase
                .from('products')
                .insert(product);

            if (error) console.error(`  -> Error creating:`, error.message);
            else console.log(`  -> Creation success.`);
        }
    }
    console.log('--- Migration Complete ---');
}

seedProducts();
