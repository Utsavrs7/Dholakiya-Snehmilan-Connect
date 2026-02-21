/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Royal Identity
        primary: "#6B1F2B",     // deep wine maroon
        secondary: "#E6B566",   // soft royal gold

        // Backgrounds
        surface: "#FAF7F4",     // warm off-white (home body)
        dark: "#1c1c1c",

        // iOS glass helpers
        glass: "rgba(107, 31, 43, 0.75)",
        glassLight: "rgba(255,255,255,0.65)",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
        glass: "0 8px 24px rgba(0,0,0,0.18)",
      },
      backdropBlur: {
        ios: "20px",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
}

