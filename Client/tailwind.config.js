/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'red-primary': '#E53935',    // Main brand red
        'red-secondary': '#FF6F60',  // Accent/hover red
        'red-deep': '#B71C1C',       // Deep/dark red
        'red-soft': '#FFEBEE',       // Soft/light red
      },
    },
  },
  plugins: [],
}
