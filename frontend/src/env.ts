// frontend/src/env.ts

const getEnv = (craKey: string, viteKey: string, fallback: string) => {
  // Dành cho Create React App (npm start / craco)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[craKey]) {
      return process.env[craKey] as string;
    }
  } catch (e) {}
  
  // Dành cho Vite (npm run dev)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      return import.meta.env[viteKey] as string;
    }
  } catch (e) {}

  // Fallback mặc định
  return fallback;
};

export const env = {
  // Hỗ trợ cả 2 môi trường Webpack và Vite
  API_BASE_URL: getEnv('REACT_APP_API_BASE_URL', 'VITE_API_BASE_URL', 'http://127.0.0.1:8000'),
  
  // Hardcode fallback an toàn cho public Client ID vì Frontend không cần giấu Client ID
  GOOGLE_CLIENT_ID: getEnv('REACT_APP_GOOGLE_CLIENT_ID', 'VITE_GOOGLE_CLIENT_ID', '1089169398506-4hgs32j24larko51ok6dsc4rk4016b07.apps.googleusercontent.com')
};

// Export lẻ để các file khác dễ dàng import
export const API_URL = env.API_BASE_URL;
export const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;