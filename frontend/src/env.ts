// frontend/src/env.ts

const getEnv = (craKey: string, viteKey: string, fallback: string): string => {
  // 1. Dành cho Vite (VITE_ prefix, injected at build time via import.meta.env)
  try {
    const viteVal = (import.meta as any).env?.[viteKey];
    if (viteVal) return viteVal as string;
  } catch (e) {}

  // 2. Dành cho Create React App (REACT_APP_ prefix, via process.env)
  try {
    if (typeof process !== "undefined" && process.env && process.env[craKey]) {
      return process.env[craKey] as string;
    }
  } catch (e) {}

  // 3. Fallback mặc định (local dev)
  return fallback;
};

export const env = {
  // Tất cả API đều đặt dưới prefix /api — ví dụ: /api/auth/login, /api/diagrams/save
  API_BASE_URL: getEnv(
    "REACT_APP_API_BASE_URL",
    "VITE_API_BASE_URL",
    "http://localhost:8000/api",
  ),

  // Google Client ID (an toàn để hardcode ở frontend, không phải secret)
  GOOGLE_CLIENT_ID: getEnv(
    "REACT_APP_GOOGLE_CLIENT_ID",
    "VITE_GOOGLE_CLIENT_ID",
    "1089169398506-gcukhs2knqpkq72p2qiiucbgmvjhkkno.apps.googleusercontent.com",
  ),
};

// Export lẻ để các file khác dễ dàng import
export const API_URL = env.API_BASE_URL;
export const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
