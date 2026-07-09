/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mpt: {
          // 品牌色（亮暗一致）
          red: "#e83d3d",
          teal: "#087f8c",
          gold: "#d99a00",
          // 结构色 → CSS 变量（:root 亮 / .dark 暗）
          dark: "var(--mpt-dark)",
          canvas: "var(--mpt-canvas)",
          panel: "var(--mpt-panel)",
          elevated: "var(--mpt-elevated)",
          border: "var(--mpt-border)",
          muted: "var(--mpt-muted)",
          foreground: "var(--mpt-foreground)",
          success: "var(--mpt-success)",
        },
      },
      fontFamily: {
        heading: ['"Smiley Sans"', '"得意黑"', "PingFang SC", "Microsoft YaHei", "sans-serif"],
        body: ['"Noto Sans SC"', "Inter", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        mono: ['"JetBrains Mono"', "Consolas", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 250ms ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
