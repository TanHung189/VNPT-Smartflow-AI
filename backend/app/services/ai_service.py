from google import genai
from google.genai import types
import json
import re
import logging
import hashlib
import httpx
from typing import Dict, Any, List
from app.core.config import settings
from app.core.redis import redis_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.current_key_index = 0
        self.model_name = 'gemini-3-flash-preview'
        self.ollama_url = "http://localhost:11434/api/generate"
        self.ollama_model = "qwen2.5-coder:3b"

    def _get_current_client(self):
        api_key = settings.GEMINI_API_KEYS[self.current_key_index]
        return genai.Client(api_key=api_key)

    # --- Centralized Prompt ---
    def _build_system_prompt(self, text: str, current_state: str = None) -> str:
        """Centralized prompt to ensure consistency across Gemini and Ollama"""
        prompt = (
            f"BẠN LÀ CHUYÊN GIA PHÂN TÍCH HỆ THỐNG TẠI VNPT.\n"
            f"NHIỆM VỤ: Chuyển đổi văn bản nghiệp vụ thành sơ đồ luồng chuẩn React Flow.\n\n"
            f"--- QUY TẮC BẮT BUỘC VỀ ĐỊNH DẠNG JSON ---\n"
            f"BẠN BẮT BUỘC PHẢI TRẢ VỀ JSON THEO ĐÚNG CẤU TRÚC SAU, KHÔNG ĐƯỢC THIẾU BẤT KỲ KEY NÀO:\n"
            f"{{\n"
            f"  \"nodes\": [{{\"id\": \"1\", \"data\": {{\"label\": \"Bước 1\"}}, \"position\": {{\"x\": 0, \"y\": 0}}}}],\n"
            f"  \"edges\": [{{\"id\": \"e1-2\", \"source\": \"1\", \"target\": \"2\"}}]\n"
            f"}}\n"
            f"LƯU Ý: Mỗi node phải chứa đầy đủ type và các thông tin bên trong data.\n\n"
            f"--- QUY TẮC PHÂN LOẠI NODE ---\n"
            f"- 'start': Điểm bắt đầu quy trình.\n"
            f"- 'step': Các bước thực hiện nghiệp vụ thông thường.\n"
            f"- 'decision': Điểm kiểm tra, rẽ nhánh (Nếu/Thì).\n"
            f"- 'end': Điểm kết thúc.\n\n"
        )
        if current_state:
            prompt += (
                f"--- SƠ ĐỒ HIỆN TẠI ---\n"
                f"Người dùng muốn bạn CHỈNH SỬA hoặc THÊM vào sơ đồ hiện tại. Đây là JSON trạng thái hiện tại (nếu có):\n"
                f"{current_state}\n"
                f"LƯU Ý QUAN TRỌNG: Hãy phân tích kỹ yêu cầu để giữ nguyên cấu trúc cũ nếu không bị ảnh hưởng, và chỉ CẬP NHẬT/THÊM/XÓA Node. "
                f"NẾU THÊM MỚI, HÃY SINH ID MỚI KHÔNG TRÙNG LẶP. "
                f"BẠN PHẢI TRẢ VỀ TOÀN BỘ SƠ ĐỒ BAO GỒM TẤT CẢ NODE/EDGE (NẾU GIỮ LẠI) ĐỂ ĐỒNG BỘ LẠI.\n\n"
            )
        
        prompt += (
            f"--- CẤU TRÚC JSON BỔ SUNG ---\n"
            f"Mỗi node bên trong mảng 'nodes' phải chứa block data: {{ 'label', 'description', 'executor', 'duration', 'type' }}.\n\n"
            f"--- VĂN BẢN (YÊU CẦU CỦA NGƯỜI DÙNG) ---\n{text}\n\n"
            f"YÊU CẦU: TRẢ VỀ DUY NHẤT 1 KHỐI JSON, KHÔNG CÓ MARKDOWN HAY CHỮ THỪA."
        )
        return prompt

    async def generate_smart_flow(self, text: str, provider: str = "gemini", current_state: str = None) -> Dict[str, Any]:
        logger.info(f"Bắt đầu phân tích văn bản: {text[:50]}...")
        
        if "erp" in text.lower() and len(text) < 20:
            return self._get_mock_erp_data()
            
        prompt_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
        cache_key = f"vnpt:flow:text:{prompt_hash}"

        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                logger.info("⚡ [Redis] Lấy kết quả từ Cache.")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"⚠️ Lỗi Redis: {e}")

        # Primary Execution Logic with Fallback
        result = None
        if provider == "ollama":
            logger.info("🛡️ [Local AI] Đang xử lý bằng Ollama...")
            result = await self._call_ollama(text)
        else:
            logger.info("☁️ [Cloud AI] Đang xử lý bằng Gemini...")
            try:
                result = self._call_gemini_with_retry(text, current_state)
            except Exception as e:
                logger.warning(f"Gemini thất bại hoàn toàn ({e}). Chuyển hướng sang Ollama...")
                result = await self._call_ollama(text)

        if result:
            try:
                redis_client.setex(cache_key, 86400, json.dumps(result))
            except Exception as e:
                logger.warning(f"⚠️ Không thể lưu vào Redis: {e}")

        return result
    
    async def _call_ollama(self, prompt: str) -> Dict[str, Any]:
        """Gọi AI nội bộ Ollama với xử lý lỗi chi tiết"""
        # Tạo System Prompt cực kỳ sắt đá cho Qwen
        # Prompt nâng cấp cho Qwen nội bộ
        strict_prompt = (
            "Bạn là chuyên gia phân tích quy trình tại VNPT.\n"
            "NHIỆM VỤ: Chuyển văn bản sau thành JSON React Flow.\n"
            "YÊU CẦU QUAN TRỌNG: Nội dung 'label' phải trích xuất chính xác từ văn bản.\n"
            "Ví dụ: 'Tiếp nhận công văn', 'Phân loại', 'Trình lãnh đạo'...\n"
            f"Văn bản: {prompt}"
        )
        
        async with httpx.AsyncClient() as client:
            payload = {
                "model": self.ollama_model,
                "prompt": strict_prompt,
                "stream": False,
                "format": "json" 
            }
            try:
                # Tăng timeout lên 90s vì máy ProBook chạy Local AI có thể hơi chậm lúc đầu
                response = await client.post(self.ollama_url, json=payload, timeout=90.0)
                
                if response.status_code != 200:
                    raise Exception(f"Ollama trả về lỗi HTTP {response.status_code}")
                    
                result = response.json()
                raw_response = result.get('response', '')
                
                logger.info(f"Ollama response: {raw_response[:100]}...") # Log để em xem nó trả về gì
                return json.loads(raw_response)
                
            except httpx.ConnectError:
                raise Exception("KHÔNG THỂ KẾT NỐI: Hãy đảm bảo ứng dụng Ollama đã được bật!")
            except json.JSONDecodeError:
                raise Exception("AI NỘI BỘ trả về dữ liệu không đúng định dạng JSON. Hãy thử lại.")
            except Exception as e:
                logger.error(f"Lỗi Ollama chi tiết: {str(e)}")
                raise e

    

    def _call_gemini_with_retry(self, text: str, current_state: str = None) -> Dict[str, Any]:
        try:
            client = self._get_current_client()
            prompt = self._build_system_prompt(text, current_state)

            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2, 
                    response_mime_type="application/json", 
                )
            )
            
            raw_text = response.text.strip()
            json_match = re.search(r'(\{.*\}|\[.*\])', raw_text, re.DOTALL)
            clean_json = json_match.group(0) if json_match else raw_text 
            data = json.loads(clean_json) 
            return self._post_processing(data)

        except Exception as e:
            logger.error(f"Lỗi API Gemini tại key index {self.current_key_index}: {str(e)}")
            if ("429" in str(e) or "limit" in str(e).lower()) and \
               self.current_key_index < len(settings.GEMINI_API_KEYS) - 1:
                self.current_key_index += 1
                return self._call_gemini_with_retry(text, current_state)
            raise e

    # ... (Keep _post_processing and _get_mock_erp_data exactly as they are)

    def _post_processing(self, data: Dict) -> Dict:
        """Chuẩn hóa dữ liệu từ AI để React Flow có thể hiển thị chính xác"""
        try:
            nodes: List[Dict[str, Any]] = []
            edges: List[Dict[str, Any]] = []

            # 1. Bóc tách Nodes và Edges từ các cấu trúc AI có thể trả về
            if isinstance(data, dict):
                nodes = data.get("nodes") or data.get("node") or []
                edges = data.get("edges") or data.get("connections") or []
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and ("source" in item or "target" in item):
                        edges.append(item)
                    elif isinstance(item, dict):
                        nodes.append(item)

            # 2. Xử lý trường hợp AI trả về rỗng
            if not nodes:
                nodes.append({
                    "id": "empty_node",
                    "type": "step",
                    "position": {"x": 250, "y": 150},
                    "data": {"label": "Sơ đồ rỗng (Hãy thử lại)", "executor": "Hệ thống"}
                })

            # 3. Duyệt qua từng Node để chuẩn hóa Label và Position
            for i, node in enumerate(nodes):
                if not isinstance(node, dict): continue
                
                # Gán ID nếu thiếu
                if "id" not in node: node["id"] = str(i + 1)
                
                # Gán vị trí nếu thiếu (Sắp xếp theo hàng dọc đơn giản)
                if "position" not in node:
                    node["position"] = {"x": 250, "y": i * 150}
                
                # Xử lý data field (Phần Hưng đang bị lỗi mapping)
                node_data = node.get("data", {})
                
                # Chiến thuật "truy tìm label" để dứt điểm lỗi "CHƯA GÁN"
                raw_label = (
                    node_data.get("label") or 
                    node.get("label") or 
                    node_data.get("task") or 
                    node_data.get("step_name") or
                    f"Bước {i + 1}"
                )
                
                node["data"] = {
                    "label": raw_label,
                    "executor": node_data.get("executor") or node.get("executor") or "Chưa xác định",
                    "description": node_data.get("description") or node.get("description") or "Nhấn để xem chi tiết..."
                }

            # 4. Chuẩn hóa Edges
            for j, edge in enumerate(edges):
                if not isinstance(edge, dict): continue
                if "id" not in edge:
                    src = edge.get("source")
                    tgt = edge.get("target")
                    edge["id"] = f"e{src}-{tgt}-{j}"

            return {"nodes": nodes, "edges": edges}

        except Exception as ex:
            logger.exception(f"Lỗi khi chuẩn hóa dữ liệu AI: {ex}")
            return {"nodes": [], "edges": []}

    def _get_mock_erp_data(self):
        """Hàm dự phòng khi demo (Luôn phải nằm ngoài khối try của hàm trên)"""
        return {
            "nodes": [
                {"id": "1", "type": "start", "data": {"label": "Khởi tạo ERP", "executor": "Ban Giám Đốc"}, "position": {"x": 250, "y": 0}},
                {"id": "2", "type": "step", "data": {"label": "Khảo sát hiện trạng", "executor": "Phòng CNTT"}, "position": {"x": 250, "y": 150}},
            ],
            "edges": [{"id": "e1-2", "source": "1", "target": "2"}]
        }
    
ai_service = AIService()