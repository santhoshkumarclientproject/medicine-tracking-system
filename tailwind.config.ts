import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clay: {
          bg: "#EEF2F6",
          darkBg: "#0F172A",
          surface: "#F8FAFC",
          darkSurface: "#1E293B",
          card: "#FFFFFF",
          darkCard: "#162032",
        },
      },
      boxShadow: {
        clay: "8px 8px 20px #cbd5e1, -8px -8px 20px #ffffff, inset 2px 2px 4px rgba(255, 255, 255, 0.7), inset -2px -2px 4px rgba(0, 0, 0, 0.04)",
        "clay-dark": "10px 10px 24px #080c14, -8px -8px 20px #1e293b, inset 1px 1px 2px rgba(255, 255, 255, 0.08), inset -1px -1px 2px rgba(0, 0, 0, 0.5)",
        "clay-btn": "6px 6px 14px #cbd5e1, -4px -4px 10px #ffffff, inset 2px 2px 3px rgba(255, 255, 255, 0.8), inset -2px -2px 3px rgba(0, 0, 0, 0.05)",
        "clay-btn-dark": "6px 6px 16px #080c14, -4px -4px 12px #1e293b, inset 1px 1px 2px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.4)",
        "clay-pressed": "inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff",
        "clay-pressed-dark": "inset 3px 3px 6px #080c14, inset -2px -2px 4px #1e293b",
        "bento-card": "0 10px 30px -10px rgba(0,0,0,0.06), 0 20px 25px -5px rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        clay: "1.75rem",
        "clay-sm": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
