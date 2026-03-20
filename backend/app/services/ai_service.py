import google.generativeai as genai
import json
import re
import logging
from typing import Dict, Any
from app.core.config import settings

# Thiết lập log để theo dõi hành vi AI
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.current_key_index = 0
        self.model_name = 'gemini-1.5-flash' # Nâng cấp lên 1.5 để hiểu ngữ cảnh tốt hơn

    def generate_smart_flow(self, text: str) -> Dict[str, Any]:
        """Hàm chính điều hướng xử lý"""
        logger.info(f"Bắt đầu phân tích văn bản: {text[:50]}...")
        
        # 1. Xử lý trường hợp đặc biệt (Mock data hoặc Cache nếu cần)
        if "erp" in text.lower() and len(text) < 20:
            return self._get_mock_erp_data()
            
        # 2. Gọi AI xử lý
        return self._call_gemini_with_retry(text)

    def _call_gemini_with_retry(self, text: str) -> Dict[str, Any]:
        try:
            api_key = settings.GEMINI_API_KEYS[self.current_key_index]
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(self.model_name)
            
            # PROMPT CHUYÊN GIA: Ép AI suy luận logic trước khi xuất JSON
            prompt = (
                f"BẠN LÀ CHUYÊN GIA PHÂN TÍCH HỆ THỐNG (SYSTEM ANALYST) TẠI VNPT.\n"
                f"NHIỆM VỤ: Chuyển đổi văn bản nghiệp vụ thành sơ đồ luồng (Flowchart) chuẩn React Flow.\n\n"
                f"--- QUY TẮC PHÂN LOẠI NODE ---\n"
                f"- 'start': Điểm bắt đầu quy trình.\n"
                f"- 'step': Các bước thực hiện nghiệp vụ thông thường.\n"
                f"- 'decision': Điểm kiểm tra, phê duyệt, rẽ nhánh (Nếu/Thì).\n"
                f"- 'end': Điểm kết thúc quy trình.\n\n"
                f"--- CẤU TRÚC JSON YÊU CẦU ---\n"
                f"Mỗi node phải chứa data: {{ 'label', 'description', 'executor', 'duration', 'type' }}.\n"
                f"LƯU Ý: 'type' trong data phải phản ánh tính chất nghiệp vụ (task, decision, v.v.).\n\n"
                f"--- VĂN BẢN CẦN PHÂN TÍCH ---\n"
                f"{text}\n\n"
                f"YÊU CẦU: TRẢ VỀ DUY NHẤT 1 KHỐI JSON. Đảm bảo logic edge nối từ ID nguồn đến ID đích chính xác."
            )

            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2, # Giảm nhiệt độ để AI bớt 'sáng tạo' lung tung, tập trung vào cấu trúc
                    response_mime_type="application/json", # Ép kiểu trả về là JSON (Gemini 1.5 hỗ trợ)
                )
            )
            
            # Làm sạch dữ liệu trả về
            raw_text = response.text.strip()
            json_match = re.search(r'(\{.*\}|\[.*\])', raw_text, re.DOTALL)
            clean_json = json_match.group(0) if json_match else raw_text
            
            data = json.loads(clean_json)
            
            # Hậu xử lý: Chuẩn hóa tọa độ và Metadata
            return self._post_processing(data)

        except Exception as e:
            logger.error(f"Lỗi API Gemini tại key index {self.current_key_index}: {str(e)}")
            if ("429" in str(e) or "limit" in str(e).lower()) and \
               self.current_key_index < len(settings.GEMINI_API_KEYS) - 1:
                self.current_key_index += 1
                return self._call_gemini_with_retry(text)
            raise e

    def _post_processing(self, data: Dict) -> Dict:
        """Chuẩn hóa dữ liệu sau khi AI trả về để đảm bảo Frontend không bị lỗi"""
        nodes = data.get("nodes", [])
        edges = data.get("edges", [])

        # Đảm bảo Node có tọa độ cơ bản (Frontend sẽ dùng Dagre để layout lại sau)
        for i, node in enumerate(nodes):
            if "position" not in node:
                node["position"] = {"x": i * 250, "y": i * 150}
            
            # Ép kiểu type cho SmartNode.tsx nhận diện
            if "type" not in node:
                node["type"] = "taskNode"
            
            # Đảm bảo có data để tránh crash giao diện
            if "data" not in node:
                node["data"] = {"label": "Bản tin trống", "executor": "N/A"}

        return {"nodes": nodes, "edges": edges}

    def _get_mock_erp_data(self):
        """Dữ liệu mẫu chuẩn để demo nhanh"""
        return {
            "nodes": [
                {"id": "1", "type": "start", "data": {"label": "Khởi tạo ERP", "executor": "Ban Giám Đốc"}, "position": {"x": 0, "y": 0}},
                {"id": "2", "type": "step", "data": {"label": "Khảo sát hiện trạng", "executor": "Phòng CNTT"}, "position": {"x": 0, "y": 150}},
            ],
            "edges": [{"id": "e1-2", "source": "1", "target": "2"}]
        }

ai_service = AIService()