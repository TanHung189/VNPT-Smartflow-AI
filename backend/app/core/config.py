#================================================================
# VNPT SmartFlow AI — Cấu hình hệ thống (Settings)
# Tất cả giá trị đều đọc từ biến môi trường (.env)
# KHÔNG hardcode bất kỳ secret, IP hay endpoint vào file này
#================================================================

import os
from dotenv import load_dotenv
load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))

    # ── Gemini API Keys ───────────────────────────────────────────
    # Hỗ trợ 2 format:
    # 1. Chuỗi phân cách bởi dấu phẩy: GEMINI_API_KEYS=key1,key2  (Docker)
    # 2. Các biến riêng lẻ: GEMINI_API_KEY_1, GEMINI_API_KEY_2   (Local .env)
    GEMINI_API_KEYS = []
    _keys_str = os.getenv("GEMINI_API_KEYS", "")
    if _keys_str:
        GEMINI_API_KEYS = [k.strip() for k in _keys_str.split(",") if k.strip()]
    else:
        for k in sorted([key for key in os.environ.keys() if key.startswith("GEMINI_API_KEY_")]):
            val = os.getenv(k)
            if val:
                GEMINI_API_KEYS.append(val)

    # ── JWT / Auth ────────────────────────────────────────────────
    # SECRET_KEY được docker-compose truyền vào, còn local .env dùng JWT_SECRET_KEY
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY", "fallback-secret")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # ── Database ──────────────────────────────────────────────────
    # DATABASE_URL được docker-compose truyền, DB_URL được local .env dùng
    DB_URL: str = os.getenv("DATABASE_URL") or os.getenv("DB_URL", "")

    # ── Google OAuth2 ─────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # ── Ollama (Local AI) ─────────────────────────────────────────
    # KHÔNG hardcode IP vào source code - đọc từ OLLAMA_HOST env
    # Docker:    host.docker.internal:11434
    # Local dev: localhost:11434
    # VPS:       <ip-may-ollama>:11434
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:1.5b")

    @property
    def OLLAMA_BASE_URL(self) -> str:
        host = self.OLLAMA_HOST
        if not host.startswith("http"):
            host = f"http://{host}"
        return f"{host}/api/generate"

    # ── CORS ──────────────────────────────────────────────────────
    # Comma-separated list of allowed frontend origins
    # Development: để trống (allow all)
    # Production:  CORS_ORIGINS=https://smartflow.vnpt.vn,https://www.smartflow.vnpt.vn
    CORS_ORIGINS_STR: str = os.getenv("CORS_ORIGINS", "")

    @property
    def CORS_ORIGINS(self) -> list:
        if self.CORS_ORIGINS_STR.strip():
            return [o.strip() for o in self.CORS_ORIGINS_STR.split(",") if o.strip()]
        return ["*"]  # Development fallback

    # ── Email (Forgot Password) ───────────────────────────────────
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "noreply@vnpt.vn")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "VNPT SmartFlow AI")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "true").lower() == "true"
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "false").lower() == "true"

    # ── Frontend URL (cho link email reset password) ──────────────
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # ── Password Reset Token TTL (phút) ──────────────────────────
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "30")
    )

    # ── Rate Limiting ─────────────────────────────────────────────
    # Số request AI tối đa mỗi phút / IP (0 = tắt rate limit)
    AI_RATE_LIMIT_PER_MINUTE: int = int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "15"))

    # ── Monitoring / Sentry ────────────────────────────────────────
    # Lấy tại https://sentry.io → Project Settings → Client Keys → DSN
    # Để trống nếu chưa muốn dùng Sentry (không crash app)
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    SENTRY_ENVIRONMENT: str = os.getenv("SENTRY_ENVIRONMENT", "development")
    # Tỷ lệ lấy mẫu performance trace (0.0–1.0). 0.1 = 10% request
    SENTRY_TRACES_SAMPLE_RATE: float = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))

settings = Settings()
