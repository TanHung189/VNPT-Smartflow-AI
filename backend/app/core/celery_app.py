# ================================================================
# Celery Application — VNPT SmartFlow AI
#
# Celery dùng Redis làm Broker (hàng đợi) và Backend (lưu kết quả)
# Broker: Redis DB 1 | Backend: Redis DB 2 | App cache: Redis DB 0
# ================================================================

import os
from celery import Celery


def _build_redis_url(base_url: str, db: int) -> str:
    """
    Xây dựng Redis URL với database number cụ thể.
    Xử lý đúng các format: redis://host:port/0, redis://:password@host:port/0
    """
    # Tách phần query string nếu có
    if "?" in base_url:
        base_url = base_url.split("?")[0]

    # Thay thế database number cuối URL
    # Pattern: redis://host:port/{db}
    import re
    # Thay thế /0 hoặc /1 hoặc /n ở cuối URL
    new_url = re.sub(r"/\d+$", f"/{db}", base_url)
    # Nếu không có db number ở cuối, thêm vào
    if new_url == base_url and not base_url.endswith(f"/{db}"):
        new_url = base_url.rstrip("/") + f"/{db}"
    return new_url


# Đọc REDIS_URL từ biến môi trường
REDIS_BASE_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

CELERY_BROKER_URL = _build_redis_url(REDIS_BASE_URL, 1)   # DB 1 cho Celery broker
CELERY_RESULT_BACKEND = _build_redis_url(REDIS_BASE_URL, 2)  # DB 2 cho kết quả task

celery_app = Celery(
    "vnpt_smartflow",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["app.tasks.ai_tasks"],  # Đăng ký module chứa tasks
)

# ── Cấu hình Celery ──────────────────────────────────────────
celery_app.conf.update(
    # Timezone
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,

    # Serialization: dùng JSON (an toàn, không dùng pickle)
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    # TTL kết quả task: giữ 1 giờ trong Redis
    result_expires=3600,

    # Reliability: task được xác nhận sau khi hoàn thành (không mất khi worker crash)
    task_acks_late=True,
    worker_prefetch_multiplier=1,  # Xử lý 1 task mỗi lần (AI task nặng)

    # Timeout: AI task tối đa 5 phút (300s), hard limit 6 phút
    task_soft_time_limit=300,
    task_time_limit=360,

    # Routing: Tất cả AI tasks vào queue riêng
    task_routes={
        "app.tasks.ai_tasks.*": {"queue": "ai_queue"},
    },

    # Lưu kết quả để polling
    task_ignore_result=False,
)
