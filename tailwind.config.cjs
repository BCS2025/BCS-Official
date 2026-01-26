/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'wood': {
                    50: '#fcf9f2',
                    100: '#f6f0dd',
                    200: '#eddcb5',
                    300: '#e1c183',
                    400: '#d5a557',
                    500: '#cc8d3a',
                    600: '#b06f2e',
                    700: '#8d5427',
                    800: '#744326',
                    900: '#603823',
                    950: '#351d11',
                },
                'muji': {
                    white: '#f9f9f9',
                    gray: '#e8e8e8',
                    text: '#4a4a4a',
                }
            },
            fontFamily: {
                'serif': ['"Noto Serif TC"', 'serif'],
                'sans': ['"Noto Sans TC"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
