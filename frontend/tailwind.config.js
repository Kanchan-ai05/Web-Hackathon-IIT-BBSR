/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cit: {
          50: "#f0f7ff",
          100: "#e0effe",
          500: "#0284c7",
          600: "#0369a1",
          700: "#075985",
          800: "#0c4a6e",
          900: "#082f49",
        },
        navy: {
          950: "#070B14",
          900: "#0B1120",
          850: "#0E1626",
          800: "#131E33",
          750: "#18243C",
          700: "#1E293B",
        },
        neon: {
          cyan: "#00F0FF",
          blue: "#38BDF8",
          purple: "#A855F7",
          green: "#10B981",
        }
      },
      boxShadow: {
        "glow-cyan": "0 0 20px -3px rgba(6, 182, 212, 0.25)",
        "glow-cyan-sm": "0 0 10px -2px rgba(6, 182, 212, 0.2)",
        "glow-blue": "0 0 20px -3px rgba(59, 130, 246, 0.25)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
      }
    },
  },
  plugins: [],
};
