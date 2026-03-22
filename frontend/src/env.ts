// frontend/src/env.ts

export const env = {
  // URL của Backend FastAPI
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
  
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  
  // Các cấu hình khác (nếu có)
  NODE_ENV: import.meta.env.MODE || "development",
};

// Export lẻ để các file khác dễ dàng import { API_URL }
export const API_URL = env.VITE_API_BASE_URL;
export const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID;