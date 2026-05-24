/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0f1117',
        surface: '#13151f',
        'surface-2': '#181b27',
        border: '#1e2130',
        'text-primary': '#e2e8f0',
        'text-muted': '#8892a4',
        accent: {
          DEFAULT: '#7f77dd',
          hover: '#9089e8',
          muted: '#5d57a3'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-cursor': 'pulseCursor 1s ease-in-out infinite',
        'bounce-dot': 'bounceDot 1.4s ease-in-out infinite'
      },
      keyframes: {
        pulseCursor: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.2' }
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: true
  }
};
