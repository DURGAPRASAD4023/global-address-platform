/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f4f7f7",
          100: "#e3eaeb",
          200: "#c5d3d5",
          300: "#9bb3b7",
          400: "#6d8e94",
          500: "#527378",
          600: "#415d62",
          700: "#374d51",
          800: "#304145",
          900: "#2b383b",
          950: "#172225",
        },
        accent: {
          DEFAULT: "#0d9488",
          soft: "#14b8a6",
          deep: "#0f766e",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(23,34,37,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(23,34,37,0.06) 1px, transparent 1px)",
        "hero-wash":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(13,148,136,0.18), transparent), linear-gradient(180deg, #f4f7f7 0%, #e8f0f0 45%, #dfe9ea 100%)",
      },
    },
  },
  plugins: [],
};
