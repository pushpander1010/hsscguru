import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f6f9ff",
          100: "#eaf1ff",
          200: "#cfe0ff",
          300: "#a9c6ff",
          400: "#7aa6ff",
          500: "#4b85ff",   // primary
          600: "#2e67e6",
          700: "#234fba",
          800: "#1e4196",
          900: "#1c377b",
        },
        ink: {
          50:"#f7f7f8",
          100:"#eeeef0",
          200:"#dcdde1",
          300:"#b8bbc5",
          400:"#8b90a1",
          500:"#5d647b",
          600:"#3d465f",
          700:"#2e3549",
          800:"#23293a",
          900:"#1c2130"
        }
      },
      boxShadow: {
        'soft': '0 10px 30px -12px rgba(0,0,0,0.15)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      }
    }
  },
  plugins: [],
};
export default config;
