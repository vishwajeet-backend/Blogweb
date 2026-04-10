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
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: {
          50: '#faf9f7',
          100: '#f5f1e8',
          200: '#ebe4d5',
          300: '#e0d6c2',
        },
        forest: {
          50: '#f0f4f2',
          100: '#d9e5df',
          200: '#a8c4b5',
          300: '#6b9580',
          400: '#47654f',
          500: '#2c4a3a',
          600: '#1f3529',
          700: '#152619',
          800: '#0d180f',
          900: '#050a06',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
