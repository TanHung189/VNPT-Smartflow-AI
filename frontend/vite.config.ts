import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Cấu hình Proxy để gọi API ngắn gọn hơn
      "/api": {
        target: "http://127.0.0.1:8000", // Địa chỉ Backend FastAPI
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
