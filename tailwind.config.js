/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(240, 5%, 84%)",
        background: "hsl(0, 0%, 100%)",
        foreground: "hsl(222.2, 47.4%, 11.2%)",
      },
    },
  },
  plugins: [],
}
