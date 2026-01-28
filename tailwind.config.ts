import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1a365d", // Navy Blue (Finance-app style)
        success: "#10B981", // Canlı yeşil
        warning: "#F59E0B", // Canlı turuncu
        danger: "#EF4444", // Canlı kırmızı
        secondary: "#6B7280",
        background: "#FFFFFF", // Pure white background
        accent: "#1a365d", // Navy Blue accent
      },
    },
  },
  plugins: [],
}

export default config