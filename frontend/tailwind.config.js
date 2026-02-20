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
        serif: ['Merriweather', 'serif'], // Optional for headings if needed
      },
      colors: {
        // Light Theme Palette (Beige / Sage)
        light: {
          50: '#F9FAF7',  // Main Background (Warm Beige/Off-white)
          100: '#F2F1EA', // Secondary Background / Sidebar
          200: '#E5E7EB', // Borders
          300: '#D1D5DB', // Borders Stronger
          900: '#111827', // Text Main
          800: '#1F2937', // Text Secondary
          500: '#6B7280', // Text Muted
        },

        // Semantic Aliases
        background: '#F9FAF7', // light-50
        surface: '#FFFFFF',    // White for cards
        'surface-hover': '#F9FAFB', // Gray-50
        border: '#E5E7EB',     // light-200

        // Primary (Darker Sage Green)
        primary: {
          DEFAULT: '#5B6D53', // Darker Sage
          hover: '#4A5A43',
          foreground: '#FFFFFF',
        },

        // Text
        text: {
          main: '#111827', // Gray 900
          muted: '#6B7280', // Gray 500
          light: '#9CA3AF', // Gray 400
        },

        // Accents
        accent: {
          purple: '#8b5cf6',
          blue: '#6366f1',
          teal: '#2dd4bf',
          rose: '#f43f5e',
          amber: '#fbbf24',
          sky: '#38bdf8',
        },
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}