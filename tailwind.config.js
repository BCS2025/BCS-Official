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
                // 販創所（綠色系，500 對準 LOGO）
                'store': {
                    50:  '#ECF7EE',
                    100: '#CFEED5',
                    300: '#7FCC8B',
                    500: '#41AB56',
                    700: '#2C7B3B',
                    900: '#154322',
                },
                // 鍛造工坊（橘色系，500 對準 LOGO）
                'forge': {
                    50:  '#FDF1E6',
                    100: '#FADBBE',
                    300: '#EDA55C',
                    500: '#D37018',
                    700: '#9A500F',
                    900: '#522A07',
                },
                // 創客世界（藍色系，500 對準 LOGO）
                'maker': {
                    50:  '#E8F0FA',
                    100: '#BFD4EE',
                    300: '#3C7DD3',
                    500: '#064DAC',
                    700: '#053A82',
                    900: '#021F48',
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
