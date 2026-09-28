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
        // Lighter red for use ON the ink background (AA contrast; #CC0000 fails there).
        "editorial-on-dark": "#FF6B6B",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "'Times New Roman'", "serif"],
        body: ["'Lora'", "Georgia", "serif"],
        sans: ["'Inter'", "'Helvetica Neue'", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};
