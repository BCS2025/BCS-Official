/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // 比創空間母品牌
                'bcs': {
                    black:  '#111111',
                    white:  '#FFFFFF',
                    gray:   '#F5F5F5',
                    muted:  '#6B7280',
                    border: '#E5E7EB',
                },
                // 販創所（橘色系）
                'store': {
                    50:  '#FFF3ED',
                    100: '#FFE4CC',
                    300: '#F9A97A',
                    500: '#EA580C',
                    700: '#C2410C',
                    900: '#7C2D12',
                },
                // 鍛造工坊（藍色系）
                'forge': {
                    50:  '#EFF6FF',
                    100: '#DBEAFE',
                    300: '#93C5FD',
                    500: '#1D4ED8',
                    700: '#1E40AF',
                    900: '#1E3A8A',
                },
                // 創客世界（綠色系）
                'maker': {
                    50:  '#F0FDF4',
                    100: '#DCFCE7',
                    300: '#86EFAC',
                    500: '#16A34A',
                    700: '#15803D',
                    900: '#14532D',
                },
            },
            fontFamily: {
                'serif': ['"Noto Serif TC"', 'serif'],
                'sans':  ['"Noto Sans TC"', 'sans-serif'],
            },
            borderRadius: {
                'card': '1rem',      // 16px，統一卡片圓角
                'btn':  '0.625rem',  // 10px，統一按鈕圓角
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
                'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
            },
        },
    },
    plugins: [],
}
