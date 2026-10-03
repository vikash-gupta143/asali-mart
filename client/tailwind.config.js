
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF6B00",
          dark: "#E55F00",
          light: "#FF8A33",
        },
        secondary: "#1A1A2E",
        accent: "#00C853",
        danger: "#E53935",
        bg: "#F8F9FB",
        card: "#FFFFFF",
        muted: "#6B7280",
        dark: "#111827",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.06)",
        card: "0 2px 12px rgba(0,0,0,0.08)",
        hover: "0 8px 30px rgba(255,107,0,0.15)",
      },
      borderRadius: {
        xl2: "16px",
      },
    },
  },
  plugins: [],
};

