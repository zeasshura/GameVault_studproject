/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // RAWG-inspired dark palette
        rawg: {
          bg:      '#1a1a1a',
          surface: '#202020',
          card:    '#272727',
          hover:   '#2f2f2f',
          border:  '#3d3d3d',
          muted:   '#5a5a5a',
        },
        // Green accent — RAWG rating / highlight color
        green: {
          400: '#a2d86a',
          500: '#6dc849',
          600: '#5aaa3b',
        },
        // Keep primary as muted gray-blue for nav active states
        primary: {
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
