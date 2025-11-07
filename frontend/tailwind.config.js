/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          600: '#2f6b3a',
          700: '#245631',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}


