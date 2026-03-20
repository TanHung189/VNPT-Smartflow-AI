#================================================================
#FILE NÀY SẼ DÙNG ĐỂ QUẢN LÝ CÁC API KEY, PORT, DATABASE,........
#================================================================

import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT"))

    # Gom các GEMINI_API_KEY_* thành 1 danh sách theo thứ tự khóa tên
    GEMINI_API_KEYS = []
    for k in sorted([key for key in os.environ.keys() if key.startswith("GEMINI_API_KEY_")]):
        val = os.getenv(k)
        if val:
            GEMINI_API_KEYS.append(val)

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

    # --- CẤU HÌNH DATABASE (Nên thêm vào đây để quản lý tập trung) ---
    DB_URL: str = os.getenv("DB_URL")
settings = Settings()

