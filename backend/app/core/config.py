#================================================================
#FILE NÀY SẼ DÙNG ĐỂ QUẢN LÝ CÁC API KEY, PORT, DATABASE,........
#================================================================

import os
from dotenv import load_dotenv #dotenv thư viện giúp python đoc được file .env

load_dotenv()

class settings:
    GEMINI_API_KEYS = [
        os.getenv("GEMINI_API_KEY_1"),
        os.getenv("GEMINI_API_KEY_2"),
        os.getenv("GEMINI_API_KEY_3")
    ]
    PORT = int(os.getenv("PORT", 8000))

settings = settings()

