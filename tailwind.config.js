/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 复刻 MoneyPrinterTurbo webui 的红/青/金配色
        mpt: {
          red: "#e83d3d",
          teal: "#087f8c",
          gold: "#d99a00",
          dark: "#0f1419",
          panel: "#161b22",
          border: "#30363d",
          muted: "#8b949e",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
