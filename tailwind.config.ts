import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#fffdf8",
          100: "#fdf6e9",
          200: "#f6ead4",
          300: "#ecd9b8",
        },
        wood: {
          500: "#8b6b4a",
          600: "#6f5238",
          700: "#5a422e",
        },
        coffee: {
          500: "#6f4e37",
          600: "#5a3d2b",
          700: "#3d291c",
          900: "#2a1b12",
        },
        accent: {
          soft: "#c49a6c",
          mint: "#9cbfa6",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-gangwon-edu-all)",
          "GangwonEduAll",
          "Malgun Gothic",
          "Apple SD Gothic Neo",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 8px 28px rgba(42, 27, 18, 0.08)",
        lift: "0 12px 36px rgba(42, 27, 18, 0.12)",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
