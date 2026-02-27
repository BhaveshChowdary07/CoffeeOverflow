/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mediblue: '#1f2937',
        mediblueSoft: '#111827',
        medigreen: '#22c55e',
        medired: '#ef4444',
        mediyellow: '#f59e0b'
      },
      boxShadow: {
        'soft': '0 15px 40px rgba(15, 23, 42, 0.6)'
      }
    }
  },
  plugins: []
}
