/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          bg: '#F4F7FB',
          card: '#FFFFFF',
          cardLight: '#EEF2F7',
          cardHover: '#E5EBF3',
          border: '#D8E0EA',
          accent: '#0891B2',
          secondary: '#0F766E',
          healthy: '#15803D',
          warning: '#D97706',
          critical: '#DC2626',
          blue: '#2563EB',
          purple: '#7C3AED',
          muted: '#64748B',
          text: '#172033'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
