/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0b0b0c',
          secondary: '#131314',
          elevated: '#1b1b1d',
          border: '#2a2a2d',
        },
        brand: {
          DEFAULT: '#d62f33',
          light: '#ff6b6e',
          dark: '#a8262a',
        },
        accent: {
          green: '#22c55e',
          red: '#ef4444',
          yellow: '#f59e0b',
        },
        text: {
          primary: '#f4f4f5',
          secondary: '#a1a1aa',
          muted: '#85858f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { transform: 'translateX(-10px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      }
    },
  },
  plugins: [],
}
