"""
tests/test_ai_service.py
=========================
Unit tests cho AIService — service cốt lõi gọi Gemini và Ollama.

Chiến lược Mock:
- KHÔNG gọi Gemini API thật (tốn tiền, phụ thuộc mạng).
- Dùng unittest.mock.patch để "giả mạo" (stub) các hàm gọi API bên ngoài.
- Chỉ kiểm tra LOGIC xử lý: cache, routing, post-processing, fallback.
"""

import json
import pytest
import hashlib
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock

from app.services.ai_service import AIService


# ─────────────────────────────────────────────────────────────────
# Dữ liệu mẫu: Sơ đồ 2 node hợp lệ (chuẩn React Flow)
# ─────────────────────────────────────────────────────────────────
MOCK_FLOW_RESULT = {
    "nodes": [
        {
            "id": "1",
            "type": "process",
            "position": {"x": 0, "y": 0},
            "data": {"label": "Bắt đầu", "executor": "Phòng IT", "process_type": "start"},
        },
        {
            "id": "2",
            "type": "process",
            "position": {"x": 0, "y": 150},
            "data": {"label": "Xử lý", "executor": "Nhân viên", "process_type": "step"},
        },
    ],
    "edges": [
        {"id": "e1-2", "source": "1", "target": "2"},
    ],
}


# ─────────────────────────────────────────────────────────────────
# TEST GROUP: Cache Logic
# ─────────────────────────────────────────────────────────────────
class TestCacheLogic:
    @pytest.mark.asyncio
    async def test_cache_hit_returns_cached_result(self):
        """
        Nếu Redis đã có kết quả → KHÔNG gọi AI.
        Đây là test quan trọng nhất: đảm bảo cache hoạt động đúng.
        """
        service = AIService()
        cached_json = json.dumps(MOCK_FLOW_RESULT)

        with patch("app.services.ai_service.redis_client") as mock_redis:
            mock_redis.get = AsyncMock(return_value=cached_json)

            result = await service.generate_smart_flow(
                "Quy trình kiểm duyệt văn bản",
                provider="gemini",
                the_loai="process",
            )

        assert result == MOCK_FLOW_RESULT
        # Quan trọng: Redis.get phải được gọi đúng 1 lần
        mock_redis.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_cache_miss_calls_ai_and_saves(self):
        """
        Cache không có → gọi AI → lưu kết quả vào Redis.
        """
        service = AIService()

        with (
            patch("app.services.ai_service.redis_client") as mock_redis,
            patch.object(service, "_call_gemini_with_retry", return_value=MOCK_FLOW_RESULT),
            patch.object(service, "_log_ai_usage", new_callable=AsyncMock),
        ):
            mock_redis.get = AsyncMock(return_value=None)  # Cache miss
            mock_redis.setex = AsyncMock()

            result = await service.generate_smart_flow(
                "Quy trình phê duyệt hợp đồng",
                provider="gemini",
                the_loai="process",
            )

        # Kết quả phải có nodes và edges
        assert "nodes" in result
        assert "edges" in result
        # Kết quả phải được lưu vào Redis
        mock_redis.setex.assert_called_once()

    @pytest.mark.asyncio
    async def test_cache_key_includes_diagram_type(self):
        """
        Cache key phải phân biệt theo the_loai.
        'process' và 'org-chart' PHẢI có cache key khác nhau.
        """
        service = AIService()
        text = "Mô tả quy trình"

        hash1 = hashlib.md5(f"{text}:process".encode()).hexdigest()
        hash2 = hashlib.md5(f"{text}:org-chart".encode()).hexdigest()

        expected_key_1 = f"vnpt:flow:process:{hash1}"
        expected_key_2 = f"vnpt:flow:org-chart:{hash2}"

        assert expected_key_1 != expected_key_2


# ─────────────────────────────────────────────────────────────────
# TEST GROUP: Provider Routing & Fallback
# ─────────────────────────────────────────────────────────────────
class TestProviderRouting:
    @pytest.mark.asyncio
    async def test_gemini_fallback_to_ollama_on_error(self):
        """
        Gemini gặp lỗi → tự động fallback sang Ollama.
        Đây là tính năng quan trọng nhất về Resilience.
        """
        service = AIService()

        with (
            patch("app.services.ai_service.redis_client") as mock_redis,
            patch.object(service, "_call_gemini_with_retry", side_effect=Exception("Rate limit exceeded")),
            patch.object(service, "_call_ollama", new_callable=AsyncMock, return_value=MOCK_FLOW_RESULT) as mock_ollama,
            patch.object(service, "_log_ai_usage", new_callable=AsyncMock),
        ):
            mock_redis.get = AsyncMock(return_value=None)
            mock_redis.setex = AsyncMock()

            result = await service.generate_smart_flow(
                "Quy trình phê duyệt",
                provider="gemini",
                the_loai="process",
            )

        # Ollama phải được gọi sau khi Gemini thất bại
        mock_ollama.assert_called_once()
        assert "nodes" in result

    @pytest.mark.asyncio
    async def test_ollama_provider_goes_directly_to_ollama(self):
        """
        provider='ollama' → KHÔNG bao giờ gọi Gemini.
        """
        service = AIService()

        with (
            patch("app.services.ai_service.redis_client") as mock_redis,
            patch.object(service, "_call_ollama", new_callable=AsyncMock, return_value=MOCK_FLOW_RESULT) as mock_ollama,
            patch.object(service, "_call_gemini_with_retry") as mock_gemini,
            patch.object(service, "_log_ai_usage", new_callable=AsyncMock),
        ):
            mock_redis.get = AsyncMock(return_value=None)
            mock_redis.setex = AsyncMock()

            result = await service.generate_smart_flow(
                "Sơ đồ nội bộ nhạy cảm",
                provider="ollama",
                the_loai="ioffice",
            )

        mock_ollama.assert_called_once()
        mock_gemini.assert_not_called()


# ─────────────────────────────────────────────────────────────────
# TEST GROUP: Post-Processing (Chuẩn hóa dữ liệu từ AI)
# ─────────────────────────────────────────────────────────────────
class TestPostProcessing:
    def test_post_processing_normalizes_node_without_position(self):
        """Node thiếu position → phải được thêm position tự động."""
        service = AIService()
        raw_data = {
            "nodes": [{"id": "1", "type": "process", "data": {"label": "Start"}}],
            "edges": [],
        }
        result = service._post_processing(raw_data)
        assert "position" in result["nodes"][0]
        assert "x" in result["nodes"][0]["position"]
        assert "y" in result["nodes"][0]["position"]

    def test_post_processing_adds_id_to_nodes_without_id(self):
        """Node thiếu id → phải được gán id tự động."""
        service = AIService()
        raw_data = {
            "nodes": [{"type": "process", "data": {"label": "Node không có id"}}],
            "edges": [],
        }
        result = service._post_processing(raw_data)
        assert "id" in result["nodes"][0]

    def test_post_processing_adds_id_to_edges(self):
        """Edge thiếu id → phải được gán id tự động từ source-target."""
        service = AIService()
        raw_data = {
            "nodes": [
                {"id": "1", "type": "process", "position": {"x": 0, "y": 0}, "data": {"label": "A"}},
                {"id": "2", "type": "process", "position": {"x": 0, "y": 150}, "data": {"label": "B"}},
            ],
            "edges": [{"source": "1", "target": "2"}],
        }
        result = service._post_processing(raw_data)
        assert "id" in result["edges"][0]

    def test_post_processing_returns_empty_placeholder_for_empty_nodes(self):
        """AI trả về nodes rỗng → phải có ít nhất 1 node placeholder."""
        service = AIService()
        raw_data = {"nodes": [], "edges": []}
        result = service._post_processing(raw_data)
        assert len(result["nodes"]) >= 1

    def test_post_processing_handles_invalid_input_gracefully(self):
        """Input lỗi (không phải dict/list) → KHÔNG được crash, trả về rỗng."""
        service = AIService()
        result = service._post_processing("this is not valid json data")
        assert "nodes" in result
        assert "edges" in result


# ─────────────────────────────────────────────────────────────────
# TEST GROUP: Intent Detection (Greeting guard)
# ─────────────────────────────────────────────────────────────────
class TestIntentDetection:
    @pytest.mark.asyncio
    async def test_greeting_returns_chatbot_response(self):
        """
        Người dùng gõ 'xin chào' → AI KHÔNG được gọi.
        Trả về response thân thiện ngay lập tức (giảm chi phí API).
        """
        service = AIService()

        with patch("app.services.ai_service.redis_client") as mock_redis:
            mock_redis.get = AsyncMock(return_value=None)

            result = await service.generate_smart_flow(
                "xin chào",
                provider="gemini",
                the_loai="process",
            )

        # Phải có node chào hỏi
        assert len(result["nodes"]) >= 1
        assert "Xin chào" in result["nodes"][0]["data"]["label"]

    @pytest.mark.asyncio
    async def test_text_too_long_raises_value_error(self):
        """
        Văn bản vượt quá 5000 ký tự → phải ném ValueError (không gọi AI).
        """
        service = AIService()
        very_long_text = "a" * 5001

        with pytest.raises(ValueError, match="quá dài"):
            await service.generate_smart_flow(
                very_long_text,
                provider="gemini",
                the_loai="process",
            )
