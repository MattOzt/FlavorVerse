/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f0f0f',
        accent: '#f4b183',
        'accent-deep': '#e48f45',
        surface: '#161616',
        'surface-elevated': '#1d1d1d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
