import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fox: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        dark: {
          100: "#1a1a2e",
          200: "#13131f",
          300: "#0a0a12",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fox-float": "fox-float 4s ease-in-out infinite",
        "fox-glow":  "fox-pulse-glow 2.5s ease-in-out infinite",
        "fade-up":   "fade-up 0.6s ease both",
        "shimmer":   "shimmer 3s linear infinite",
        "orbit":     "orbit 6s linear infinite",
        "ping-slow": "ping-slow 2s cubic-bezier(0,0,0.2,1) infinite",
      },
      keyframes: {
        "fox-float": {
          "0%, 100%": { transform: "translateY(0px) rotate(-2deg)" },
          "50%":      { transform: "translateY(-14px) rotate(2deg)" },
        },
        "fox-pulse-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 12px rgba(249,115,22,0.6))" },
          "50%":      { filter: "drop-shadow(0 0 28px rgba(249,115,22,1))" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        orbit: {
          from: { transform: "rotate(0deg) translateX(70px) rotate(0deg)" },
          to:   { transform: "rotate(360deg) translateX(70px) rotate(-360deg)" },
        },
        "ping-slow": {
          "75%, 100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      backgroundImage: {
        "fox-gradient": "linear-gradient(135deg, #f97316, #ea580c)",
      },
    },
  },
  plugins: [],
};

export default config;
