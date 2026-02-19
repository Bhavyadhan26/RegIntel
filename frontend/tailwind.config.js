/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#0a0c18',
          900: '#0e1025',
          800: '#131530',
          700: '#1a1d3a',
          600: '#222545',
          500: '#2d3055',
          400: '#3d4165',
          300: '#555878',
        },
        accent: {
          purple: '#8b5cf6',
          blue: '#6366f1',
          teal: '#2dd4bf',
          rose: '#f43f5e',
          amber: '#fbbf24',
          sky: '#38bdf8',
        },
      },
    },
  },
  plugins: [],
}