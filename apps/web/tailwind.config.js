/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Newsprint (front-of-house)
        paper: "#F9F9F7",
        ink: "#111111",
        divider: "#E5E5E0",
        editorial: "#CC0000",
        // Material You (internal platform) — purple seed #6750A4
        md: {
          bg: "#FFFBFE",
          on: "#1C1B1F",
          primary: "#6750A4",
          "on-primary": "#FFFFFF",
          "primary-container": "#EADDFF",
          "on-primary-container": "#21005D",
          secondary: "#625B71",
          "secondary-container": "#E8DEF8",
          "on-secondary-container": "#1D192B",
          tertiary: "#7D5260",
          "tertiary-container": "#FFD8E4",
          surface: "#F3EDF7",
          "surface-low": "#E7E0EC",
          outline: "#79747E",
          "on-variant": "#49454F",
          error: "#B3261E",
          "error-container": "#F9DEDC",
          success: "#3A6A3E",
        },
      },
      fontFamily: {
        serif: ["'Playfair Display'", "'Times New Roman'", "serif"],
        body: ["'Lora'", "Georgia", "serif"],
        sans: ["'Inter'", "'Helvetica Neue'", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Courier New'", "monospace"],
        roboto: ["'Roboto'", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        md: "cubic-bezier(0.2, 0, 0, 1)",
      },
      borderRadius: {
        "md-xl": "28px",
        "md-2xl": "32px",
        "md-3xl": "48px",
      },
    },
  },
  plugins: [],
};
