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
        // TGA brand — teal from logo circle
        tga: {
          teal: {
            50: "#e8f5f5",
            100: "#c5e4e4",
            200: "#9fd2d2",
            300: "#78bfbf",
            400: "#4da8a8",
            500: "#138A8A",
            600: "#107070",
            700: "#0c5656",
            800: "#083c3c",
            900: "#042222",
          },
          // TGA brand — orange from logo accent
          orange: {
            50: "#fef4eb",
            100: "#fce0c4",
            200: "#f9cb9d",
            300: "#f6b676",
            400: "#f39f4f",
            500: "#E57224",
            600: "#c4611e",
            700: "#a35118",
            800: "#824112",
            900: "#61300c",
          },
        },
        // Alias for backward compatibility in components
        brand: {
          50: "#e8f5f5",
          100: "#c5e4e4",
          200: "#9fd2d2",
          300: "#78bfbf",
          400: "#4da8a8",
          500: "#138A8A",
          600: "#107070",
          700: "#0c5656",
          800: "#083c3c",
          900: "#042222",
        },
      },
      backgroundImage: {
        "tga-gradient": "linear-gradient(135deg, #138A8A 0%, #0c5656 100%)",
        "tga-gradient-light": "linear-gradient(135deg, #e8f5f5 0%, #fef4eb 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
