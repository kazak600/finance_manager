/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        revo: {
          blue: '#1971ff',
          bg: '#f6f7f9',
          text: '#191c1f',
          gray: '#8e949a',
          success: '#27ae60',
          danger: '#e74c3c',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'revo-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'revo-md': '0 4px 16px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
