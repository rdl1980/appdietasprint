import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18221f",
        leaf: "#2f7d5c",
        mint: "#e8f4ee",
        lemon: "#f4c95d",
        coral: "#f06f5f",
        cream: "#fbfaf6",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(24, 34, 31, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
