// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page:   'var(--page)',
        frame:  'var(--frame)',
        raised: 'var(--raised)',
        sunken: 'var(--sunken)',
        wash:   'var(--wash)',
        'on-teal': 'var(--on-teal)',
        ink:    { DEFAULT: 'var(--ink)', 2: 'var(--ink-2)', 3: 'var(--ink-3)' },
        line:   { DEFAULT: 'var(--line)', 2: 'var(--line-2)' },
        teal:   { DEFAULT: 'var(--teal)', hover: 'var(--teal-hover)', soft: 'var(--teal-soft)' },
        copper: { DEFAULT: 'var(--copper)', ink: 'var(--copper-ink)' },
        danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
      },
      fontFamily: {
        sans: ['var(--font)'],
      },
      borderRadius: {
        frame:  'var(--r-frame)',
        canvas: 'var(--r-canvas)',
        ctl:    'var(--r-ctl)',
      },
      boxShadow: {
        raised: 'var(--shadow-raised)',
        pop:    'var(--shadow-pop)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
    },
  },
  plugins: [],
}
