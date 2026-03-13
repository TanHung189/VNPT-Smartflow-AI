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
                f"MỤC TIÊU: Phân tích văn bản quy trình nghiệp vụ thành JSON chi tiết cho React Flow.\n"
                f"VAI TRÒ: Chuyên gia phân tích quy trình tại VNPT.\n"
                f"YÊU CẦU DỮ LIỆU MỖI NODE:\n"
                f"1. 'id': Duy nhất.\n"
                f"2. 'type': Phải thuộc một trong các loại: 'start', 'step', 'decision', 'end'.\n"
                f"3. 'data': Chứa các thông tin sau:\n"
                f"   - 'label': Tên bước (ngắn gọn).\n"
                f"   - 'description': Mô tả chi tiết cách thực hiện bước này.\n"
                f"   - 'executor': Bộ phận hoặc vị trí thực hiện (ví dụ: Kỹ thuật viên, Phòng CNTT...).\n"
                f"   - 'duration': Thời gian dự kiến hoàn thành (ví dụ: 30 phút, 1 ngày...).\n"
                f"4. 'edges': Kết nối logic chính xác giữa các id.\n"
                f"CHỈ TRẢ VỀ JSON NGUYÊN BẢN, KHÔNG GIẢI THÍCH.\n\n"
                f"VĂN BẢN QUY TRÌNH: {text}"
            )
            response = model.generate_content(prompt)
            raw_text = response.text.strip()
            
            # Dùng regex để bóc tách JSON chính xác hơn nếu AI trả về văn bản thừa
            import re
            json_match = re.search(r'(\{.*\}|\[.*\])', raw_text, re.DOTALL)
            if json_match:
                clean_json = json_match.group(0)
            else:
                clean_json = raw_text

            # Thêm bước kiểm tra tọa độ (Tránh lỗi chồng node)
            data = json.loads(clean_json)
            self._ensure_node_positions(data)
            return data
        
        except Exception as e:
            if "429" in str(e) and self.current_key_index < len(settings.GEMINI_API_KEYS) - 1:
                self.current_key_index += 1
                return self._call_gemini_with_retry(text) # Thử lại với Key dự phòng
            raise e
            
    def _ensure_node_positions(self, data: dict):
        """
        Đảm bảo mỗi node có 'id' và 'position'.
        Nếu thiếu position thì đặt theo lưới; tránh trùng tọa độ bằng cách dịch phải.
        """
        nodes = data.get("nodes", [])
        if not isinstance(nodes, list):
            return

        used = set()
        col_width = 220
        row_height = 120

        for i, node in enumerate(nodes):
            # Đảm bảo có ID (ưu tiên id -> key -> n1, n2...)
            node_id = str(node.get("id") or node.get("key") or f"n{i+1}")
            node["id"] = node_id

            # Lấy hoặc khởi tạo tọa độ
            pos = node.get("position") or {}
            x = pos.get("x")
            y = pos.get("y")

            # Nếu thiếu tọa độ, tính toán theo lưới 4 cột
            if x is None or y is None:
                col = i % 4
                row = i // 4
                x = col * col_width
                y = row * row_height

            # Xử lý tránh trùng lặp: dịch phải nếu tọa độ đã bị chiếm
            key = (int(x), int(y))
            while key in used:
                x += col_width // 2
                key = (int(x), int(y))

            used.add(key)
            node["position"] = {"x": x, "y": y}
        
        data["nodes"] = nodes
ai_service = AIService()