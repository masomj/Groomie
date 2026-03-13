import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#0077cc',
          'blue-dark': '#1b6ec2',
          'blue-border': '#1861ac',
        },
        warm: {
          50: '#faf8f5',
          100: '#f5f0eb',
          200: '#e8dfd6',
        },
        accent: {
          gold: '#d97706',
          'gold-light': '#fbbf24',
        },
      },
      boxShadow: {
        soft: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
        card: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
        strong: '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', maxHeight: '0' },
          '100%': { opacity: '1', maxHeight: '500px' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
