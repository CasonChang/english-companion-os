import type { Config } from "tailwindcss";

export default {
  darkMode: "media",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08111f",
        mist: "#eef5f4",
        mint: "#9fe3c3",
        coral: "#ff9776"
      },
      boxShadow: {
        card: "0 24px 70px -30px rgba(8, 17, 31, 0.4)"
      }
    }
  },
  plugins: []
} satisfies Config;
