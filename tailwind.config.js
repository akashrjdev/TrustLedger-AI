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
        brand: {
          orange: '#F58220',
          orangeHover: '#DE6E10',
          orangeLight: '#FFF4EA',
          orangeBorder: '#FDCB9E',
          navy: '#0B192C',
          navyMuted: '#1E293B',
          dark: '#0F172A',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        risk: {
          safe: '#10B981',
          safeBg: '#ECFDF5',
          safeText: '#065F46',
          suspicious: '#F59E0B',
          suspiciousBg: '#FEF3C7',
          suspiciousText: '#92400E',
          high: '#EF4444',
          highBg: '#FEF2F2',
          highText: '#991B1B',
          blocked: '#7F1D1D',
          blockedBg: '#FEE2E2',
          blockedText: '#7F1D1D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['28px', { lineHeight: '34px', fontWeight: '800' }],
        'section-heading': ['20px', { lineHeight: '28px', fontWeight: '700' }],
        'card-title': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body-normal': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'table-text': ['14px', { lineHeight: '20px', fontWeight: '500' }],
      }
    },
  },
  plugins: [],
}
