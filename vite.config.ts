import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite 配置
// dev server 代理 /api 到后端 MoneyPrinterTurbo FastAPI（默认 18081），
// 避免 CORS 问题。后端 CORS 虽然是 *，但代理让前端代码里的 baseURL 可留空。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:18081",
        changeOrigin: true,
      },
    },
  },
});
