/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'electric-blue': '#0033FF',
                'electric-blue-hover': '#0026CC',
            },
        },
    },
    plugins: [],
}
