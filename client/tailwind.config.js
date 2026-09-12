/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rpg: {
          bg: '#070b13',
          card: '#0f172a',
          panel: '#151f38',
          border: '#2a3a5e',
          'border-gold': '#d97706',
          gold: {
            light: '#fde68a',
            DEFAULT: '#f59e0b',
            dark: '#b45309'
          },
          purple: {
            light: '#c084fc',
            DEFAULT: '#8b5cf6',
            dark: '#581c87'
          },
          emerald: {
            light: '#6ee7b7',
            DEFAULT: '#10b981',
            dark: '#047857'
          },
          ruby: {
            light: '#fca5a5',
            DEFAULT: '#ef4444',
            dark: '#b91c1c'
          },
          sapphire: {
            light: '#7dd3fc',
            DEFAULT: '#0ea5e9',
            dark: '#0369a1'
          }
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        fantasy: ['Cinzel', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'pixel': '0 4px 0 0 rgba(0, 0, 0, 0.4)',
        'pixel-lg': '0 6px 0 0 rgba(0, 0, 0, 0.6)',
        'glow-gold': '0 0 15px rgba(245, 158, 11, 0.4)',
        'glow-gold-lg': '0 0 30px rgba(245, 158, 11, 0.6)',
        'glow-purple': '0 0 15px rgba(139, 92, 246, 0.4)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.4)',
        'glow-ruby': '0 0 15px rgba(239, 68, 68, 0.4)'
      },
      animation: {
        'bounce-subtle': 'bounce 2s infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-up': 'floatUp 1.2s ease-out forwards',
        'shimmer': 'shimmer 2s infinite linear'
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '50%': { opacity: '1', transform: 'translateY(-24px) scale(1.1)' },
          '100%': { opacity: '0', transform: 'translateY(-48px) scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    },
  },
  plugins: [],
}
