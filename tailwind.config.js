/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f6f5',
          100: '#e4e9e6',
          200: '#c8d2cc',
          300: '#a3b3ab',
          400: '#7a9085',
          500: '#5f756a',
          600: '#4a5d54',
          700: '#3d4c45',
          800: '#343f3a',
          900: '#2d3632',
          950: '#171c1a',
        },
        olive: {
          400: '#8f9f5a',
          500: '#6f7f3f',
          600: '#586632',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 0 rgba(23, 28, 26, 0.06), 0 8px 24px rgba(23, 28, 26, 0.06)',
      },
    },
  },
  plugins: [],
}
