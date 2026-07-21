import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#020817",
        foreground: "#f8fafc",
        card: "#0f172a",
        cardForeground: "#f8fafc",
        primary: "#3b82f6",
        primaryHover: "#2563eb",
        border: "#1e293b",
        muted: "#1e293b",
        mutedForeground: "#64748b",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    }
  },
  plugins: []
};

export default config;
