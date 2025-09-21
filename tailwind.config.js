/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E91E63',
        secondary: '#F8BBD0',
        neutral: '#F5F5F5',
        text: '#212121',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        arabic: ['Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
}