/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#faf8f5",
          100: "#f3ede3",
          200: "#e6d9c6",
          300: "#d4bfa0",
          400: "#c0a07a",
          500: "#ab8559",
          600: "#9a724a",
          700: "#7f5d3d",
          800: "#674d35",
          900: "#55402d",
        },
        warm: {
          50: "#fdf8f0",
          100: "#faeedd",
          200: "#f4d9b5",
          300: "#ecbe84",
          400: "#e39d50",
          500: "#dc8331",
          600: "#ce6b26",
          700: "#ab5322",
          800: "#894224",
          900: "#6f3820",
        },
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
}
