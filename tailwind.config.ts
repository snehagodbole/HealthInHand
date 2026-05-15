import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        moss: {
          50: "#f2f8f3",
          100: "#dcebdd",
          500: "#5b8c64",
          600: "#477251",
          700: "#375a40"
        },
        coral: {
          50: "#fff4ef",
          100: "#ffe4d7",
          500: "#f47f58",
          600: "#e05f39"
        },
        ink: "#20302a",
        oat: "#f8f3eb"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(32, 48, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
