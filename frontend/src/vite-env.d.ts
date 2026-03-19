//Người quản lý kho .env
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // Sau này nếu em có thêm GEMINI_KEY ở Frontend thì thêm vào đây
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
