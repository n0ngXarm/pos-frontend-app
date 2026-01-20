/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 บรรทัดนี้ต้องเป๊ะ!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}