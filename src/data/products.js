
import { calculateKeychainPrice } from '../lib/pricing';

export const PRODUCTS = [
    {
        id: 'prod_keychain_custom',
        name: '客製化木質鑰匙圈',
        price: 99,
        image: '/product-thumbnails/image%20thumbnail_客製化鑰匙圈.png',
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
                    { value: 'round', label: '款式 1 (圓形)', image: '/wood-keychain-thumbnails/鑰匙圈版型_圓形.png' },
                    { value: 'heart', label: '款式 2 (心形)', image: '/wood-keychain-thumbnails/鑰匙圈版型_心形.png' },
                    { value: 'rect', label: '款式 3 (矩形)', image: '/wood-keychain-thumbnails/鑰匙圈版型_矩形.png' },
                    { value: 'shield', label: '款式 4 (盾牌)', image: '/wood-keychain-thumbnails/鑰匙圈版型_盾牌形.png' },
                    { value: 'square', label: '款式 5 (正方形)', image: '/wood-keychain-thumbnails/鑰匙圈版型_正方形.png' },
                ],
                defaultValue: 'round',
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
                condition: (config) => config.siding === 'double',
            },
        ],
    },
    {
        id: 'prod_nightlight_tile',
        name: '花磚小夜燈',
        price: 590,
        image: '/product-thumbnails/image%20thumbnail_花磚小夜燈.png',
        description: '復古花磚圖騰，結合現代工藝的優雅家飾。',
        priceDescription: '$590 / 個',
        calculatePrice: (config, qty) => 590 * (qty || 0),
        createdAt: '2024-01-25T00:00:00Z',
        fields: [
            {
                name: 'lightBase',
                label: '燈座燈光',
                type: 'select',
                options: [
                    { value: 'warm', label: '溫馨暖黃光' },
                    { value: 'white', label: '明亮白光' },
                ],
                defaultValue: 'warm',
            }
        ],
    },
    {
        id: 'prod_couplets_3d',
        name: '立體春聯',
        price: 399,
        image: '/product-thumbnails/image%20thumbnail_立體春聯.png',
        description: '創意立體設計，為傳統節日增添現代美感。',
        detailedDescription: `🔍 **產品特色**
✔ **雙層設計｜立體視覺更有層次**
✔ **手工製作｜細緻工藝提升整體質感**
✔ **雷射切割｜線條俐落、精準立體**
✔ **三款字樣可選｜福 / 財 / 發，自由搭配吉祥寓意**
✔ **輕巧材質｜方便懸掛於門上、牆面、櫃子上皆適宜**

---
📐 **商品規格**
・尺寸：12cm x 12cm
・總厚度：約5.7mm（每片板材約2.85mm）
・材質：環保植纖板
・款式：福 / 財 / 發（單售）
・製作方式：雷射切割 + 手工組裝

---
🏠 **適用場景**
・大門、房門、櫃子、玄關裝飾
・年節佈置、開運擺飾、公司行號迎春布置
・送禮自用兩相宜，年節贈禮別出心裁！

---
💡 **小提醒**
・商品為手工製作，每件略有差異屬正常現象。
・可搭配無痕膠條或雙面膠固定於平滑表面（出貨不含黏貼工具）。

---
✨ **讓「福」「財」「發」為你開啟一整年的好運！**
立即選購比創空間手作立體春聯，讓家中洋溢新年氛圍與滿滿喜氣！`,
        priceDescription: '$399 / 個',
        calculatePrice: (config, qty) => 399 * (qty || 0),
        createdAt: '2024-02-01T00:00:00Z',
        fields: [
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
    },
    {
        id: 'prod_coaster_custom',
        name: '客製化原木杯墊',
        price: 290,
        image: '/product-thumbnails/image%20thumbnail_客製化原木杯墊.png',
        description: '天然原木紋理，雷射雕刻專屬圖樣。',
        priceDescription: '$290 / 個',
        calculatePrice: (config, qty) => 290 * (qty || 0),
        createdAt: '2024-01-15T00:00:00Z',
        fields: [
            {
                name: 'material',
                label: '材質選擇',
                type: 'select',
                options: [
                    { value: 'beech', label: '櫸木 (淺色)' },
                    { value: 'walnut', label: '胡桃木 (深色)' },
                ],
                defaultValue: 'beech',
            }
        ],
    },
    {
        id: 'prod_calendar_tile',
        name: '花磚月曆',
        price: 690,
        image: '/product-thumbnails/image%20thumbnail_花磚月曆.png',
        description: '實用與美感兼具，紀錄生活的美好時刻。',
        priceDescription: '$690 / 個',
        fields: [],
        calculatePrice: (config, qty) => 690 * (qty || 0),
        createdAt: '2024-01-20T00:00:00Z',
    },
    {
        id: 'prod_nightlight_custom',
        name: '客製化小夜燈',
        price: 490,
        image: '/product-thumbnails/image%20thumbnail_客製化小夜燈.png',
        description: '溫馨暖光，點亮您的每一個夜晚。',
        priceDescription: '$490 / 個',
        calculatePrice: (config, qty) => 490 * (qty || 0),
        createdAt: '2024-01-10T00:00:00Z',
        fields: [
            {
                name: 'lightBase',
                label: '燈座燈光',
                type: 'select',
                options: [
                    { value: 'warm', label: '溫馨暖黃光' },
                    { value: 'white', label: '明亮白光' },
                ],
                defaultValue: 'warm',
            }
        ],
    }
];

export const getProductById = (id) => PRODUCTS.find(p => p.id === id);

export const getProductLabel = (productId, fieldName, value) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return value;

    const field = product.fields?.find(f => f.name === fieldName);
    const option = field?.options?.find(o => o.value === value);
    return option ? option.label : value;
};
