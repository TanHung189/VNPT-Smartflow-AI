#================================================================
#FILE NÀY SẼ DÙNG ĐỂ QUẢN LÝ CÁC API KEY, PORT, DATABASE,........
#================================================================

import os
from dotenv import load_dotenv
load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))

    # Đọc danh sách Gemini API Keys từ biến môi trường GEMINI_API_KEYS
    # Hỗ trợ 2 format:
    # 1. Chuỗi phân cách bởi dấu phẩy: GEMINI_API_KEYS=key1,key2,key3  (Docker)
    # 2. Các biến riêng lẻ: GEMINI_API_KEY_1, GEMINI_API_KEY_2,...  (Local .env)
    GEMINI_API_KEYS = []
    _keys_str = os.getenv("GEMINI_API_KEYS", "")
    if _keys_str:
        GEMINI_API_KEYS = [k.strip() for k in _keys_str.split(",") if k.strip()]
    else:
        for k in sorted([key for key in os.environ.keys() if key.startswith("GEMINI_API_KEY_")]):
            val = os.getenv(k)
            if val:
                GEMINI_API_KEYS.append(val)

    # SECRET_KEY được docker-compose truyền vào, còn local .env dùng JWT_SECRET_KEY
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY", "fallback-secret")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # DATABASE_URL được docker-compose truyền, DB_URL được local .env dùng
    DB_URL: str = os.getenv("DATABASE_URL") or os.getenv("DB_URL", "")

    # OAuth2 Google
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

settings = Settings()
