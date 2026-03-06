#==========================================
#BỘ NÃO XỬ LÝ LOGIC AI CHO TOÀN BỘ HỆ THỐNG
#==========================================

import google.generativeai as genai
import json
from app.core.config import settings

class AIService:
    def __init__(self):
        self.current_key_index = 0 #lưu index của API key đang dùng trnog mảng  

    #Hàm chính
    def generate_smart_flow(self, text: str):
        if "erp" in text.lower():
            return self._get_mock_erp_data()
        return self._call_gemini_with_retry(text)
    
    def _get_mock_erp_data(self):
        return {
            "nodes": [{"id": "1", "data": {"label": "Khảo sát ERP"}, "position": {"x": 250, "y": 0}}],
            "edges": []
        }
    
    def _call_gemini_with_retry(self, text):
        try:
            api_key = settings.GEMINI_API_KEYS[self.current_key_index]
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3-flash-preview')
            
            prompt = (
                f"MỤC TIÊU: Phân tích văn bản quy trình nghiệp vụ sau thành cấu trúc JSON để vẽ sơ đồ bằng React Flow.\n"
                f"VAI TRÒ: Bạn là một chuyên gia phân tích quy trình tại VNPT.\n"
                f"YÊU CẦU KỸ THUẬT:\n"
                f"1. Trả về một đối tượng JSON có hai mảng: 'nodes' và 'edges'.\n"
                f"2. Mỗi node phải có 'id' duy nhất, 'data': {{ 'label': 'Tên bước' }}.\n"
                f"3. Mỗi edge phải có 'id', 'source', và 'target' tương ứng với id của các node.\n"
                f"4. Tự động xác định các điểm rẽ nhánh (nếu có).\n"
                f"5. KHÔNG giải thích, KHÔNG thêm ký tự Markdown. CHỈ TRẢ VỀ JSON NGUYÊN BẢN.\n\n"
                f"VĂN BẢN QUY TRÌNH: {text}"
            ) 
            response = model.generate_content(prompt)
            clean_json = response.text.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json.replace("```json", "", 1)
            if clean_json.endswith("```"):
                clean_json = clean_json.rsplit("```", 1)[0]
            clean_json = clean_json.strip()
            return json.loads(clean_json)
            
        except Exception as e:
            if "429" in str(e) and self.current_key_index < len(settings.GEMINI_API_KEYS) - 1:
                self.current_key_index += 1
                return self._call_gemini_with_retry(text) # Thử lại với Key dự phòng
            raise e
            

ai_service = AIService()