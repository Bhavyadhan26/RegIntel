/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // We will add custom REGINTEL colors here later
        sidebar: "#f8f9fa",
      }
    },
  },
  plugins: [],
}