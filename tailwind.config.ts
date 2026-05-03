import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a5f",
        "primary-light": "#2d5a8c",
        accent: "#d4a843",
        success: "#4caf50",
        danger: "#f44336",
        warning: "#ff9800",
        bg: "#f5f7fa",
        "bg-card": "#ffffff",
        "text-primary": "#1a1a1a",
        "text-secondary": "#666666",
        border: "#e0e0e0",
      },
      fontFamily: {
        sans: ["Heebo", "system-ui", "sans-serif"],
        serif: ["'Frank Ruhl Libre'", "serif"],
      },
      keyframes: {
        floatUp: {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-60px)", opacity: "0" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        confettiFall: {
          "0%": { transform: "translateY(-20vh) rotate(0)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        bounceArrow: {
          "0%,100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-6px)" },
        },
      },
      animation: {
        "float-up": "floatUp 1.4s ease-out forwards",
        "pulse-soft": "pulseSoft 1.6s ease-in-out infinite",
        "confetti-fall": "confettiFall 2.4s ease-in forwards",
        "bounce-arrow": "bounceArrow 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
