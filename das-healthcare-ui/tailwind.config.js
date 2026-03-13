/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0f172a",
        medical: "#00d4ff",
        healthcare: "#0ea5e9",
      },
    },
  },
  plugins: [],
};
