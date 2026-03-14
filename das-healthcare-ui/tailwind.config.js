/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        medical: "var(--color-accent)",
        healthcare: "var(--color-accent-soft)",
      },
    },
  },
  plugins: [],
};
