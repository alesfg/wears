/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: "#F5F2EB",
        ink: "#1A1A1A",
        cpw: "#C4503A",
        badge: "#5C5347",
        muted: "#8A8070",
        border: "#D9D3C7",
      },
      fontFamily: {
        serif: ["DMSerifDisplay_400Regular"],
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
