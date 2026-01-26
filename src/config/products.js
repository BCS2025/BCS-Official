import { calculateKeychainPrice } from '../lib/pricing';

export const PRODUCTS = [
    {
        id: 'wooden-keychain',
        name: '客製化木質鑰匙圈',
        description: '獨一無二的專屬訂製，溫潤手感，送禮自用兩相宜。',
        priceDescription: '單面 $99 / 雙面 $150 (滿50個同內容享量販價)',
        calculatePrice: calculateKeychainPrice,
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
                    { value: 'style1', label: '款式 1 (圓形)', image: '/鑰匙圈版型_圓形.png' },
                    { value: 'style2', label: '款式 2 (心形)', image: '/鑰匙圈版型_心形.png' },
                    { value: 'style3', label: '款式 3 (矩形)', image: '/鑰匙圈版型_矩形.png' },
                    { value: 'style4', label: '款式 4 (盾牌)', image: '/鑰匙圈版型_盾牌形.png' },
                    { value: 'style5', label: '款式 5 (正方形)', image: '/鑰匙圈版型_正方形.png' },
                ],
                defaultValue: 'style1',
            },
            {
                name: 'font',
                label: '字體選擇',
                type: 'select',
                options: [
                    { value: 'lishu', label: '隸書體', image: '/鑰匙圈字體_隸書體.png' },
                    { value: 'kai', label: '楷體', image: '/鑰匙圈字體_楷體.png' },
                    { value: 'fangsong', label: '仿宋體', image: '/鑰匙圈字體_仿宋體.png' },
                    { value: 'yicai', label: '逸彩體', image: '/鑰匙圈字體_逸彩體.png' },
                    { value: 'xingcao', label: '行草', image: '/鑰匙圈字體_行草.png' },
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
                condition: (config) => config.siding === 'double', // Dynamic visibility
            },
        ],
    },
    // Future products: Night Light, Coaster...
];
