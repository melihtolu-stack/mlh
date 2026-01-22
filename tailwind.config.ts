import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB", // Canlı mavi
        success: "#10B981", // Canlı yeşil
        warning: "#F59E0B", // Canlı turuncu
        danger: "#EF4444", // Canlı kırmızı
        secondary: "#6B7280",
        background: "#F9FAFB",
        accent: "#8B5CF6", // Canlı mor
      },
    },
  },
  plugins: [],
}

export default config