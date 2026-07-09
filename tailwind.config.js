/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 三级暗色层次：画布(最深) → 面板 → 浮层
        mpt: {
          red: "#e83d3d",
          teal: "#087f8c",
          gold: "#d99a00",
          dark: "#080a0d",      // 最深：画布/页面底色
          canvas: "#0a0d12",    // 画布区(带氛围)
          panel: "#11161d",     // 面板
          elevated: "#171d25",  // 弹窗/浮层/卡片
          border: "#232b35",    // 边框(提亮)
          muted: "#9ba6b2",     // 次要文字(提亮, 达 WCAG AA)
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
