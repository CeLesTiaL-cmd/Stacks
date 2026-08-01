/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAF8",
        surface: "#F4F4F2",
        ink: "#1C1C1C",
        muted: "#5F6368",
        line: "#E7E7E7",
        accent: {
          DEFAULT: "#1B4332",
          dark: "#123226",
          tint: "#E8F0EB",
        },
      },
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(28,28,28,0.04)",
      },
    },
  },
  plugins: [],
};
