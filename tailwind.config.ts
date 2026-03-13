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
      colors: {
        brand: {
          blue: '#0077cc',
          'blue-dark': '#1b6ec2',
          'blue-border': '#1861ac',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
