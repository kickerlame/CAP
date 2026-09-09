/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        vppt: {
          bg:       '#0B0B0D',
          surface:  '#111114',
          card:     '#17171B',
          elevated: '#1D1D22',
          border:   '#2A2926',
          border2:  '#34332F',
          gold:     '#C6A15B',
          gold2:    '#8F7440',
          ash:      '#B8B5AC',
          ivory:    '#E7E2D5',
          success:  '#6F8F72',
          warning:  '#B08A4A',
          critical: '#9B4D4D',
          crimson:  '#9B4D4D',
          info:     '#65758B',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter:  ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in': 'slideIn 200ms ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
