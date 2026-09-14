// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#111111',
        panel:   '#0d0d0d',
        border:  '#1f1f1f',
        muted:   '#666666',
      },
    },
  },
  plugins: [],
}
