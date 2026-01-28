
import { calculateKeychainPrice } from '../lib/pricing';

export const PRODUCTS = [
    {
        id: 'wooden-keychain',
        name: '客製化木質鑰匙圈',
        price: 99,
        image: import.meta.env.BASE_URL + 'product%20image%20thumbnail/image%20thumbnail_客製化鑰匙圈.png',
        description: '獨一無二的專屬訂製，溫潤手感，送禮自用兩相宜。',
        priceDescription: '單面 $99 / 雙面 $150 (滿50個同內容享量販價)',
        calculatePrice: calculateKeychainPrice,
        createdAt: '2023-01-01T00:00:00Z',
        fields: [
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
                    { value: 'style1', label: '款式 1 (圓形)', image: import.meta.env.BASE_URL + 'wood%20key%20chain%20image%20thumbnail/鑰匙圈版型_圓形.png' },
                    { value: 'style2', label: '款式 2 (心形)', image: import.meta.env.BASE_URL + 'wood%20key%20chain%20image%20thumbnail/鑰匙圈版型_心形.png' },
                    { value: 'style3', label: '款式 3 (矩形)', image: import.meta.env.BASE_URL + 'wood%20key%20chain%20image%20thumbnail/鑰匙圈版型_矩形.png' },
                    { value: 'style4', label: '款式 4 (盾牌)', image: import.meta.env.BASE_URL + 'wood%20key%20chain%20image%20thumbnail/鑰匙圈版型_盾牌形.png' },
                    { value: 'style5', label: '款式 5 (正方形)', image: import.meta.env.BASE_URL + 'wood%20key%20chain%20image%20thumbnail/鑰匙圈版型_正方形.png' },
                ],
                defaultValue: 'style1',
            },
            {
                name: 'font',
                label: '字體選擇',
                type: 'select',
                options: [
                    { value: 'lishu', label: '隸書體', image: import.meta.env.BASE_URL + 'wood%20key%20chain%20image%20thumbnail/鑰匙圈字體_隸書體.png' },
                    { value: 'kai', label: '楷體', image: import.meta.env.BASE_URL + 'wood%20key%20chain%20image%20thumbnail/鑰匙圈字體_楷體.png' },
                    { value: 'fangsong', label: '仿宋體', image: import.meta.env.BASE_URL + 'wood%20key%20chain%20image%20thumbnail/鑰匙圈字體_仿宋體.png' },
                    { value: 'yicai', label: '逸彩體', image: import.meta.env.BASE_URL + 'wood%20key%20chain%20image%20thumbnail/鑰匙圈字體_逸彩體.png' },
                    { value: 'xingcao', label: '行草', image: import.meta.env.BASE_URL + 'wood%20key%20chain%20image%20thumbnail/鑰匙圈字體_行草.png' },
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
                condition: (config) => config.siding === 'double',
            },
        ],
    },
    {
        id: 'night-light',
        name: '客製化小夜燈',
        price: 490,
        image: import.meta.env.BASE_URL + 'product%20image%20thumbnail/image%20thumbnail_客製化小夜燈.png',
        description: '溫馨暖光，點亮您的每一個夜晚。',
        priceDescription: '$490 / 個',
        fields: [],
        calculatePrice: (config, qty) => 490 * (qty || 0),
        createdAt: '2023-06-01T00:00:00Z',
    },
    {
        id: 'wooden-coaster',
        name: '客製化原木杯墊',
        price: 290,
        image: import.meta.env.BASE_URL + 'product%20image%20thumbnail/image%20thumbnail_客製化原木杯墊.png',
        description: '天然原木紋理，雷射雕刻專屬圖樣。',
        priceDescription: '$290 / 個',
        fields: [],
        calculatePrice: (config, qty) => 290 * (qty || 0),
        createdAt: '2023-03-01T00:00:00Z',
    },
    {
        id: 'spring-couplets',
        name: '立體春聯',
        price: 390,
        image: import.meta.env.BASE_URL + 'product%20image%20thumbnail/image%20thumbnail_立體春聯.png',
        description: '創意立體設計，為傳統節日增添現代美感。',
        priceDescription: '$390 / 組',
        fields: [],
        calculatePrice: (config, qty) => 390 * (qty || 0),
        createdAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 'tile-night-light',
        name: '花磚小夜燈',
        price: 590,
        image: import.meta.env.BASE_URL + 'product%20image%20thumbnail/image%20thumbnail_花磚小夜燈.png',
        description: '復古花磚圖騰，結合現代工藝的優雅家飾。',
        priceDescription: '$590 / 個',
        fields: [],
        calculatePrice: (config, qty) => 590 * (qty || 0),
        createdAt: '2023-11-01T00:00:00Z',
    },
    {
        id: 'tile-calendar',
        name: '花磚月曆',
        price: 690,
        image: import.meta.env.BASE_URL + 'product%20image%20thumbnail/image%20thumbnail_花磚月曆.png',
        description: '實用與美感兼具，紀錄生活的美好時刻。',
        priceDescription: '$690 / 個',
        fields: [],
        calculatePrice: (config, qty) => 690 * (qty || 0),
        createdAt: '2023-12-01T00:00:00Z',
    },
];

export const getProductById = (id) => PRODUCTS.find(p => p.id === id);

export const getProductLabel = (productId, fieldName, value) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return value;

    const field = product.fields?.find(f => f.name === fieldName);
    const option = field?.options?.find(o => o.value === value);
    return option ? option.label : value;
};
