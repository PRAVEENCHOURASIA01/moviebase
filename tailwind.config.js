/** @type {import('tailwindcss').Config} */
export default {
  // Class-based dark mode — toggled via <html class="dark">
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {
      // ─────────────────────────────────────
      // Brand color palette
      // ─────────────────────────────────────
      colors: {
        brand: {
          DEFAULT: '#E50914',   // MovieBase red (primary CTA)
          hover: '#b20710',
          muted: '#ff6b6b',
        },
        surface: {
          DEFAULT: '#141414',  // App background
          elevated: '#1c1c1c',  // Cards, modals
          hover: '#242424',  // Hover state for cards
          border: '#2a2a2a',  // Subtle borders
        },
        text: {
          primary: '#ffffff',
          secondary: '#a3a3a3',
          muted: '#525252',
        },
        rating: {
          great: '#22c55e',   // green-500
          good: '#3b82f6',   // blue-500
          bad: '#f97316',   // orange-500
          worst: '#ef4444',   // red-500
        },
      },

      // ─────────────────────────────────────
      // Typography
      // ─────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },

      // ─────────────────────────────────────
      // Spacing extras
      // ─────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },

      // ─────────────────────────────────────
      // Border radius
      // ─────────────────────────────────────
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      // ─────────────────────────────────────
      // Animations
      // ─────────────────────────────────────
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'shimmer': 'shimmer 1.6s linear infinite',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
      },

      // ─────────────────────────────────────
      // Aspect ratios (movie poster = 2:3)
      // ─────────────────────────────────────
      aspectRatio: {
        'poster': '2 / 3',
      },
    },
  },

  plugins: [],
}