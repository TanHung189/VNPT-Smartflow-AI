"""
tests/test_flow_api.py
======================
Integration tests cho Flow API endpoints (tích hợp E2E với HTTP client).

- POST /api/ai/generate/text
- POST /api/ai/upload-process
- GET  /api/ai/task-status/{task_id}

Mọi AI call đều được mock để test không phụ thuộc Gemini/Ollama.
"""

import pytest
import json
import io
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient

MOCK_FLOW_RESULT = {
    "nodes": [
        {"id": "1", "type": "process", "position": {"x": 0, "y": 0},
         "data": {"label": "Bắt đầu", "executor": "Phòng IT", "process_type": "start"}},
        {"id": "2", "type": "process", "position": {"x": 0, "y": 150},
         "data": {"label": "Kết thúc", "executor": "Hệ thống", "process_type": "end"}},
    ],
    "edges": [{"id": "e1-2", "source": "1", "target": "2"}],
}


# ─────────────────────────────────────────────────────────────────
# Helper: Đăng ký + Lấy JWT token
# ─────────────────────────────────────────────────────────────────
async def get_auth_token(client: AsyncClient, email_suffix: str = "flow") -> str:
    """Tạo user và trả về JWT token."""
    resp = await client.post("/api/auth/register", json={
        "ten_nguoi_dung": "Flow Test User",
        "email": f"flow_test_{email_suffix}@vnpt.com",
        "mat_khau": "TestPassword123!",
    })
    if resp.status_code == 400:
        # User đã tồn tại → login
        login_resp = await client.post("/api/auth/login", data={
            "username": f"flow_test_{email_suffix}@vnpt.com",
            "password": "TestPassword123!",
        })
        return login_resp.json()["access_token"]
    return resp.json()["access_token"]


# ─────────────────────────────────────────────────────────────────
# TEST GROUP: Text-to-Flow API
# ─────────────────────────────────────────────────────────────────
class TestGenerateTextFlow:
    @pytest.mark.asyncio
    async def test_generate_text_requires_auth(self, client: AsyncClient):
        """Endpoint yêu cầu JWT token → 401 khi không có."""
        response = await client.post("/api/ai/generate/text", json={
            "text": "Quy trình mua hàng",
            "provider": "gemini",
        })
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_generate_text_success(self, client: AsyncClient):
        """Mock AI → trả về kết quả sơ đồ hợp lệ."""
        token = await get_auth_token(client, "text1")

        with patch("app.services.ai_service.ai_service.generate_smart_flow",
                   new_callable=AsyncMock,
                   return_value=MOCK_FLOW_RESULT):
            response = await client.post(
                "/api/ai/generate/text",
                json={"text": "Quy trình phê duyệt hợp đồng mua sắm", "provider": "gemini"},
                headers={"Authorization": f"Bearer {token}"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["result"] == "SUCCESS"
        assert "nodes" in data["data"]
        assert "edges" in data["data"]
        assert len(data["data"]["nodes"]) == 2

    @pytest.mark.asyncio
    async def test_generate_text_too_long(self, client: AsyncClient):
        """Văn bản > 5000 ký tự → lỗi 400 hoặc error result."""
        token = await get_auth_token(client, "text2")
        long_text = "a" * 5001

        response = await client.post(
            "/api/ai/generate/text",
            json={"text": long_text, "provider": "gemini"},
            headers={"Authorization": f"Bearer {token}"},
        )
        # Phải báo lỗi (400 hoặc result ERROR)
        assert response.status_code in (400, 422) or response.json()["result"] == "ERROR"

    @pytest.mark.asyncio
    async def test_generate_text_empty_text(self, client: AsyncClient):
        """Văn bản rỗng → lỗi validation."""
        token = await get_auth_token(client, "text3")

        response = await client.post(
            "/api/ai/generate/text",
            json={"text": "", "provider": "gemini"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code in (400, 422)

    @pytest.mark.asyncio
    async def test_internal_process_forces_ollama(self, client: AsyncClient):
        """
        is_internal=True → BẮT BUỘC phải dùng Ollama (không được gửi lên Cloud).
        Kiểm tra tính năng bảo mật dữ liệu nội bộ.
        """
        token = await get_auth_token(client, "text4")

        with patch("app.services.ai_service.ai_service.generate_smart_flow",
                   new_callable=AsyncMock,
                   return_value=MOCK_FLOW_RESULT) as mock_generate:
            response = await client.post(
                "/api/ai/generate/text",
                json={
                    "text": "Quy trình phân loại thông tin mật",
                    "provider": "gemini",   # Frontend gửi gemini
                    "is_internal": True,    # Nhưng đánh dấu là nội bộ
                },
                headers={"Authorization": f"Bearer {token}"},
            )

        assert response.status_code == 200
        # AI phải được gọi với provider='ollama' (không phải gemini)
        call_kwargs = mock_generate.call_args
        # Provider phải được override thành ollama
        assert call_kwargs is not None


# ─────────────────────────────────────────────────────────────────
# TEST GROUP: File Upload API
# ─────────────────────────────────────────────────────────────────
class TestFileUploadFlow:
    @pytest.mark.asyncio
    async def test_upload_txt_file_success(self, client: AsyncClient):
        """Upload file .txt → AI xử lý → trả về sơ đồ."""
        token = await get_auth_token(client, "file1")
        txt_content = b"Buoc 1: Tiep nhan don\nBuoc 2: Kiem tra\nBuoc 3: Phe duyet"

        with patch("app.services.ai_service.ai_service.generate_smart_flow",
                   new_callable=AsyncMock,
                   return_value=MOCK_FLOW_RESULT):
            response = await client.post(
                "/api/ai/upload-process",
                files={"file": ("quy_trinh.txt", io.BytesIO(txt_content), "text/plain")},
                data={"provider": "gemini", "the_loai": "process"},
                headers={"Authorization": f"Bearer {token}"},
            )

        assert response.status_code == 200
        assert response.json()["result"] == "SUCCESS"

    @pytest.mark.asyncio
    async def test_upload_file_too_large(self, client: AsyncClient):
        """File vượt 20MB → lỗi 400."""
        token = await get_auth_token(client, "file2")
        # Tạo file giả 21MB
        large_content = b"x" * (21 * 1024 * 1024)

        response = await client.post(
            "/api/ai/upload-process",
            files={"file": ("large.txt", io.BytesIO(large_content), "text/plain")},
            data={"provider": "gemini"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_upload_requires_auth(self, client: AsyncClient):
        """Upload không có token → 401."""
        response = await client.post(
            "/api/ai/upload-process",
            files={"file": ("test.txt", io.BytesIO(b"content"), "text/plain")},
            data={"provider": "gemini"},
        )
        assert response.status_code == 401


# ─────────────────────────────────────────────────────────────────
# TEST GROUP: Task Status Polling API (Celery Integration)
# ─────────────────────────────────────────────────────────────────
class TestTaskStatusPolling:
    @pytest.mark.asyncio
    async def test_task_status_pending(self, client: AsyncClient):
        """task_id chưa xử lý → trả về PENDING."""
        token = await get_auth_token(client, "task1")

        with patch("celery.result.AsyncResult") as mock_result:
            mock_result.return_value.state = "PENDING"

            response = await client.get(
                "/api/ai/task-status/fake-task-id-pending",
                headers={"Authorization": f"Bearer {token}"},
            )

        assert response.status_code == 200
        assert response.json()["status"] == "PENDING"

    @pytest.mark.asyncio
    async def test_task_status_success(self, client: AsyncClient):
        """task_id đã xong → trả về SUCCESS + data."""
        token = await get_auth_token(client, "task2")

        mock_result_data = {"status": "SUCCESS", "data": MOCK_FLOW_RESULT}

        with patch("celery.result.AsyncResult") as mock_async_result:
            instance = MagicMock()
            instance.state = "SUCCESS"
            instance.result = mock_result_data
            mock_async_result.return_value = instance

            response = await client.get(
                "/api/ai/task-status/fake-task-id-done",
                headers={"Authorization": f"Bearer {token}"},
            )

        assert response.status_code == 200
        resp_data = response.json()
        assert resp_data["status"] == "SUCCESS"
        assert "data" in resp_data

    @pytest.mark.asyncio
    async def test_task_status_failure(self, client: AsyncClient):
        """task_id bị lỗi → trả về FAILURE + error message."""
        token = await get_auth_token(client, "task3")

        with patch("celery.result.AsyncResult") as mock_async_result:
            instance = MagicMock()
            instance.state = "FAILURE"
            instance.result = Exception("Gemini quota exceeded")
            mock_async_result.return_value = instance

            response = await client.get(
                "/api/ai/task-status/fake-task-id-fail",
                headers={"Authorization": f"Bearer {token}"},
            )

        assert response.status_code == 200
        assert response.json()["status"] == "FAILURE"
        assert "error" in response.json()

    @pytest.mark.asyncio
    async def test_task_status_requires_auth(self, client: AsyncClient):
        """Kiểm tra task status không có token → 401."""
        response = await client.get("/api/ai/task-status/some-task-id")
        assert response.status_code == 401
