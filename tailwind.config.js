/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand — GarageFlow blue
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Accent — workshop amber
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d4d9e2',
          300: '#adb6c7',
          400: '#808da6',
          500: '#606b8a',
          600: '#4c5571',
          700: '#3e455c',
          800: '#363c4e',
          900: '#0f1729',
          950: '#080c17',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      // Density is set by the 14px root font size in index.css (see the `html`
      // rule) rather than by overriding this scale — a plain CSS rule takes
      // effect on hot-reload, whereas changes to this file only apply when the
      // dev server restarts.
      fontSize: {
        heading: ['1rem', '1.375rem'], //       16 @ root
        subHeading: ['0.875rem', '1.25rem'], // 14
        paragraph: ['0.75rem', '1.125rem'], //  12
        subParagraph: ['0.625rem', '0.875rem'], // 10
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15,23,41,0.06), 0 1px 2px -1px rgba(15,23,41,0.05)',
        soft: '0 4px 24px -8px rgba(15,23,41,0.10), 0 2px 8px -4px rgba(15,23,41,0.06)',
        glow: '0 8px 32px -8px rgba(37,99,235,0.35)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'slide-in': 'slide-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}
