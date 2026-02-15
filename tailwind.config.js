/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'military-green': {
                    400: '#22c55e',
                    500: '#16a34a',
                    600: '#15803d'
                }
            },
            backgroundImage: {
                'tactical-grid': `
          linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
        `
            }
        },
    },
    plugins: [],
}