from google import genai
from google.genai import types
import json
import re
import logging
import hashlib
import httpx
import time
import asyncio
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.core.redis import redis_client
from app.database.session import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.ai_model import MoHinhAI
from sqlalchemy import select

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# DIAGRAM_PROMPT_CONFIG
# Mỗi the_loai → dict gồm: role (persona AI), node_types, data_fields, extra_rules
# ─────────────────────────────────────────────────────────────────────────────
DIAGRAM_PROMPT_CONFIG: Dict[str, Dict[str, Any]] = {
    "org-chart": {
        "role": (
            "BẠN LÀ CHUYÊN GIA NHÂN SỰ VÀ QUẢN TRỊ TỔ CHỨC TẠI VNPT (Role HR).\n"
            "Nhiệm vụ: Xây dựng sơ đồ tổ chức (Org Chart) dạng phân cấp rõ ràng."
        ),
        "node_types": ["org-chart"],
        "data_fields": '{ "label": "Họ tên", "position_title": "Chức vụ", "department": "Phòng ban", "level": "executive|manager|staff" }',
        "extra_rules": (
            "- Mỗi node PHẢI có `level` là một trong: executive, manager, staff.\n"
            "- Cấu trúc: Lãnh đạo (executive) → Quản lý (manager) → Nhân viên (staff).\n"
            "- Layout gợi ý: chiều từ Trên xuống Dưới (TB).\n"
            "- [TOPOLOGY RULES]: Cấu trúc Cây (Tree Hierarchy). Chỉ có 1 node Root (ví dụ: Giám đốc). Các node cấp dưới phải nhận 'source' từ node quản lý trực tiếp. Không được nối vòng tròn. Bắt buộc 'type' của tất cả các node phải là 'org-chart'.\n"
        ),
    },
    "layered": {
        "role": (
            "BẠN LÀ KIẾN TRÚC SƯ HỆ THỐNG PHẦN MỀM TẠI VNPT.\n"
            "Nhiệm vụ: Thiết kế sơ đồ Layered Architecture (kiến trúc phân tầng)."
        ),
        "node_types": ["layer"],
        "data_fields": '{ "label": "Tên tầng", "layer_type": "presentation|business|data|infrastructure", "tech_stack": ["..."], "description": "Mô tả ngắn" }',
        "extra_rules": (
            "- Mỗi node phải có `layer_type` phù hợp.\n"
            "- `tech_stack` là mảng tên công nghệ, ví dụ: [\"React\", \"TypeScript\"].\n"
            "- Ràng buộc tính chất Group/Sub-flow (ví dụ tầng UI, API, Database).\n"
            "- Các tầng kết nối từ trên xuống: Presentation → Business → Data → Infrastructure.\n"
        ),
    },
    "uml": {
        "role": (
            "BẠN LÀ KIẾN TRÚC SƯ PHẦN MỀM (Role Software Architect) TẠI VNPT, CHUYÊN GIA VỀ OOP.\n"
            "Nhiệm vụ: Sinh sơ đồ UML Class Diagram hoặc Use Case Diagram chuẩn quốc tế."
        ),
        "node_types": ["uml"],
        "data_fields": '{ "label": "ClassName", "uml_type": "class|interface|usecase|actor", "stereotype": "entity|controller|boundary", "attributes": ["- id: UUID", "+ name: string"], "methods": ["+ save(): void"], "visibility": "public|private|protected" }',
        "extra_rules": (
            "- Class: thêm `attributes` và `methods` dưới dạng mảng chuỗi.\n"
            "- Actor: `uml_type` = 'actor', không cần attributes/methods.\n"
            "- UseCase: `uml_type` = 'usecase', có `label` và `description`.\n"
            "- [TOPOLOGY RULES]: Cấu trúc Mạng lưới (Network). Edges PHẢI có trường 'label' để ghi chú loại quan hệ (ví dụ: Inheritance, Association, Aggregation). Bắt buộc 'type' của tất cả các node phải là 'uml'.\n"
        ),
    },
    "ioffice": {
        "role": (
            "BẠN LÀ CHUYÊN GIA QUY TRÌNH HÀNH CHÍNH (Role Admin Process Expert) TẠI VNPT.\n"
            "Nhiệm vụ: Vẽ luồng quy trình hành chính số chuẩn ISO 9001."
        ),
        "node_types": ["process"],
        "data_fields": '{ "label": "Tên bước", "process_type": "start|step|decision|approval|end", "executor": "Người/BP thực hiện", "status": "pending|in_progress|completed|rejected", "duration": "1 ngày", "description": "Mô tả", "document_ref": "CV-2024-001" }',
        "extra_rules": (
            "- BẮT BUỘC: Bắt đầu bằng `process_type: start`, kết thúc bằng `process_type: end`.\n"
            "- `decision` node kết nối 2 nhánh với edge label 'Có' và 'Không'.\n"
            "- Tập trung vào `executor` và `status` cho mỗi bước.\n"
            "- [TOPOLOGY RULES]: Cấu trúc Tuyến tính hoặc Phân nhánh. Bước trước nối sang bước sau. Bắt buộc 'type' của tất cả các node phải là 'process'.\n"
        ),
    },
    "mindmap": {
        "role": (
            "BẠN LÀ CHUYÊN GIA SÁNG TẠO VÀ TƯ DUY TRỰC QUAN TẠI VNPT.\n"
            "Nhiệm vụ: Xây dựng sơ đồ tư duy (Mindmap) dạng cây ngang (Horizontal Tree) từ Trái sang Phải."
        ),
        "node_types": ["mindmapNode"],
        "data_fields": '{ "label": "Ý tưởng", "isRoot": false, "isExpanded": true, "level": "root|branch|leaf" }',
        "extra_rules": (
            "- Node gốc (trung tâm): `\"isRoot\": true`, `\"level\": \"root\"`, `\"isExpanded\": true`.\n"
            "- Nút nhánh (branch): `\"level\": \"branch\"`, `\"isExpanded\": true`.\n"
            "- Nút lá (leaf): `\"level\": \"leaf\"`, không có node con.\n"
            "- [TOPOLOGY RULES]: Cấu trúc Cây ngang (Horizontal Tree). 1 Node gốc (ở bên trái) phân nhánh sang phải. Tất cả các node phải có 'type': 'mindmapNode'. Không khép vòng.\n"
        ),
    },
    "infrastructure": {
        "role": (
            "BẠN LÀ KỸ SƯ HẠ TẦNG MẠNG VÀ VIỄN THÔNG TẠI VNPT.\n"
            "Nhiệm vụ: Thiết kế sơ đồ topology mạng, data center, hoặc hạ tầng viễn thông."
        ),
        "node_types": ["layer"],
        "data_fields": '{ "label": "Tên thiết bị/dịch vụ", "layer_type": "infrastructure", "tech_stack": ["Cisco", "OSPF"], "description": "Thông số kỹ thuật" }',
        "extra_rules": (
            "- Thể hiện: Core Layer → Distribution Layer → Access Layer.\n"
            "- Ghi rõ băng thông, giao thức (OSPF, BGP, MPLS) trong `description`.\n"
        ),
    },
    "process": {
        "role": (
            "BẠN LÀ CHUYÊN GIA PHÂN TÍCH QUY TRÌNH NGHIỆP VỤ TẠI VNPT.\n"
            "Nhiệm vụ: Chuyển đổi mô tả thành sơ đồ luồng quy trình chuẩn BPM."
        ),
        "node_types": ["process"],
        "data_fields": '{ "label": "Tên bước", "process_type": "start|step|decision|end", "executor": "Người thực hiện", "status": "pending|in_progress|completed", "duration": "...", "description": "Mô tả chi tiết" }',
        "extra_rules": (
            "- Bắt đầu bằng `process_type: start`, kết thúc bằng `process_type: end`.\n"
            "- Mỗi bước step phải có `executor` rõ ràng.\n"
            "- [TOPOLOGY RULES]: Cấu trúc Tuyến tính hoặc Phân nhánh. Bước trước nối sang bước sau. Bắt buộc 'type' của tất cả các node (ngoại trừ condition) phải là 'process'.\n"
        ),
    },
    "network": {
        "role": (
            "BẠN LÀ KỸ SƯ HẠ TẦNG MẠNG VÀ VIỄN THÔNG (NETWORK ENGINEER) TẠI VNPT.\n"
            "Nhiệm vụ: Vẽ sơ đồ network topology, data center rõ ràng."
        ),
        "node_types": ["networkNode", "layer"],
        "data_fields": '{ "label": "Thiết bị/Kết nối", "layer_type": "infrastructure", "tech_stack": ["VLAN", "IP Sec"], "description": "Thông số" }',
        "extra_rules": (
            "- Tạo các node theo kiến trúc mạng (Ví dụ: OSPF, BGP, LAN, WAN).\n"
        ),
    }
}

_DEFAULT_CONFIG = {
    "role": (
        "BẠN LÀ CHUYÊN GIA PHÂN TÍCH HỆ THỐNG TẠI VNPT.\n"
        "Nhiệm vụ: Chuyển đổi văn bản thành sơ đồ luồng chuẩn React Flow."
    ),
    "node_types": ["step", "decision", "start", "end"],
    "data_fields": '{ "label": "Tên bước", "executor": "Người thực hiện", "description": "Mô tả" }',
    "extra_rules": (
        "- 'start': Điểm bắt đầu.\n"
        "- 'step': Bước thực hiện.\n"
        "- 'decision': Điểm rẽ nhánh.\n"
        "- 'end': Điểm kết thúc.\n"
    ),
}


class AIService:
    def __init__(self):
        self.current_key_index = 0
        self.model_name = 'gemini-3.0-flash-preview'
        self.ollama_url = "http://100.94.87.76:11434/api/generate"
        self.ollama_model = "qwen2.5-coder:1.5b"

    def _get_current_client(self):
        api_key = settings.GEMINI_API_KEYS[self.current_key_index]
        return genai.Client(api_key=api_key)

# --- Centralized Dynamic Prompt ---
    def _build_system_prompt(self, text: str, the_loai: str = "process") -> str:
        """
        Dynamic context-aware system prompt.
        The_loai determines which domain expert persona is injected.
        """
        # Lấy cấu hình từ điển, mặc định fallback về _DEFAULT_CONFIG
        cfg = DIAGRAM_PROMPT_CONFIG.get(the_loai.lower(), _DEFAULT_CONFIG)
        node_types = cfg.get("node_types", ["process"])
        node_type_str = " | ".join(node_types)
        
        # Đảm bảo node_type đầu tiên an toàn để làm ví dụ
        first_node_type = node_types[0] if node_types else "process"
        
        # Sử dụng chuỗi thô (Raw string) hoặc gán biến độc lập để tránh lỗi f-string escape
        data_fields_example = cfg.get("data_fields", '{"label": "Tên nút"}')
        
        # Xây dựng System Persona & Định dạng bằng tiếng Việt tường minh
        prompt = (
            f"{cfg.get('role', 'BẠN LÀ CHUYÊN GIA PHÂN TÍCH QUY TRÌNH.')}\n\n"
            f"--- QUY TẮC BẮT BUỘC VỀ ĐỊNH DẠNG JSON ---\n"
            f"Hệ thống yêu cầu xuất dữ liệu tuân thủ nghiêm ngặt theo cấu trúc JSON đồ thị sau:\n"
            f"{{\n"
            f"  \"nodes\": [\n"
            f"    {{\n"
            f"      \"id\": \"1\",\n"
            f"      \"type\": \"{first_node_type}\",\n"
            f"      \"position\": {{\"x\": 0, \"y\": 0}},\n"
            f"      \"data\": {data_fields_example}\n"
            f"    }}\n"
            f"  ],\n"
            f"  \"edges\": [\n"
            f"    {{\"id\": \"e1-2\", \"source\": \"1\", \"target\": \"2\", \"label\": \"nhãn (tùy chọn)\"}}\n"
            f"  ]\n"
            f"}}\n\n"
            f"--- DANH SÁCH LOẠI NODE HỢP LỆ ---\n"
            f"CHỈ ĐƯỢC PHÉP sử dụng các giá trị 'type' sau cho mảng nodes: {node_type_str}\n\n"
            f"--- QUY TẮC CHUYÊN BIỆT CHO LOẠI SƠ ĐỒ `{the_loai.upper()}` ---\n"
            f"{cfg.get('extra_rules', '')}\n\n"
            f"--- RÀNG BUỘC CHỐNG ẢO GIÁC (HALLUCINATION CONSTRAINTS) ---\n"
            f"1. BẮT BUỘC GIỮ NGUYÊN văn bản gốc đối với tên thực thể, địa danh, phòng ban, cá nhân. NGHIÊM CẤM tự ý viết tắt, thay thế hoặc lược bỏ.\n"
            f"2. Mỗi đơn vị, cá nhân, bước quy trình hoặc thực thể độc lập xuất hiện trong văn bản PHẢI được ánh xạ thành một Node riêng biệt.\n"
            f"3. Nếu văn bản liệt kê cụ thể N thực thể (ví dụ: 15 chi nhánh/địa phương), mảng 'nodes' bắt buộc phải kết xuất chính xác N phần tử tương ứng.\n"
            f"4. TUYỆT ĐỐI KHÔNG sáng tạo hoặc suy diễn thêm các bước/thực thể không được đề cập trong văn bản đầu vào.\n"
            f"5. Không giới hạn số lượng Node sinh ra nhằm bảo đảm tính toàn vẹn tuyệt đối của dữ liệu nguồn.\n\n"
            f"--- VĂN BẢN ĐẦU VÀO CẦN PHÂN TÍCH ---\n"
            f"{text}\n\n"
            f"YÊU CẦU TỐI HẬU: TRẢ VỀ DUY NHẤT 1 KHỐI JSON HỢP LỆ. KHÔNG BỌC TRONG THẺ MARKDOWN (```json), KHÔNG SINH CÂU DẪN GIẢI HOẶC BẤT KỲ KÝ TỰ THỪA NÀO KHÁC."
        )
        return prompt

    async def generate_smart_flow(
        self,
        text: str,
        provider: str = "gemini",
        the_loai: str = "process",
    ) -> Dict[str, Any]:
        logger.info(f"[AI] Loại sơ đồ: {the_loai} | Provider: {provider} | Text: {text[:60]}...")

        if the_loai == "auto":
            detected_type = await self._detect_diagram_intent(text, provider)
            logger.info(f"💡 [Auto-Detect] Thay đổi the_loai='auto' thành '{detected_type}'")
            the_loai = detected_type

        # Intent Classification: Fast text return for simple greetings
        text_clean = text.strip().lower()
        greetings = ["hello", "hi", "xin chào", "chào bạn", "alo", "chào"]
        if text_clean in greetings or (len(text_clean) < 15 and any(g in text_clean for g in greetings)):
            return {
                "nodes": [
                    {
                        "id": "chat_reply",
                        "type": "customNode",
                        "position": {"x": 250, "y": 150},
                        "data": {
                            "label": "Xin chào! 👋",
                            "executor": "AI SmartFlow",
                            "description": "Tôi là Trợ lý AI VNPT. Hãy mô tả chi tiết quy trình hoặc hệ thống bạn muốn tôi vẽ nhé!"
                        }
                    }
                ],
                "edges": []
            }

        if "erp" in text.lower() and len(text) < 20:
            return self._get_mock_erp_data()

        prompt_hash = hashlib.md5(f"{text}:{the_loai}".encode('utf-8')).hexdigest()
        cache_key = f"vnpt:flow:{the_loai}:{prompt_hash}"

        try:
            cached_data = await redis_client.get(cache_key)
            if cached_data:
                logger.info("⚡ [Redis] Cache hit.")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"⚠️ Redis error: {e}")

        result = None

        # ─── PROVIDER ROUTING ────────────────────────────────────────────────────
        # FE gửi provider = tên model (ví dụ: 'qwen2.5-coder:1.5b') hoặc 'ollama'/'gemini'.
        # Tra cứu DB để biết nha_cung_cap thực sự, đồng thời cập nhật endpoint và model name.
        nha_cung_cap = provider  # fallback: giữ nguyên nếu DB không có

        try:
            async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with async_session_maker() as db:
                stmt = select(MoHinhAI).where(
                    MoHinhAI.ten_mo_hinh == provider,
                    MoHinhAI.trang_thai_hoat_dong == True,
                )
                db_model = (await db.execute(stmt)).scalar_one_or_none()
                if db_model:
                    nha_cung_cap = db_model.nha_cung_cap
                    if nha_cung_cap == "ollama":
                        self.ollama_model = db_model.ten_mo_hinh
                        if db_model.endpoint_url:
                            self.ollama_url = db_model.endpoint_url
                    elif nha_cung_cap == "gemini":
                        self.model_name = db_model.ten_mo_hinh
                    self._current_config = db_model.tham_so_cau_hinh or {}
                    logger.info(f"[AI] DB lookup OK: '{provider}' → nha_cung_cap='{nha_cung_cap}'")
                else:
                    logger.warning(f"[AI] Không tìm thấy model '{provider}' trong DB, dùng fallback routing.")
        except Exception as e:
            logger.error(f"[AI] Lỗi query DB model: {e}")

        # ─── FALLBACK: Nếu DB lookup thất bại, phân loại provider theo heuristic ─
        # Các chuỗi chứa ':' hoặc model name nội bộ đặc trưng → route về Ollama
        OLLAMA_KEYWORDS = ["ollama", "qwen", "llama", "mistral", "phi", "gemma", "deepseek"]
        if nha_cung_cap not in ("ollama", "gemini"):
            is_ollama_model = any(kw in nha_cung_cap.lower() for kw in OLLAMA_KEYWORDS)
            if is_ollama_model:
                logger.warning(f"[AI] Heuristic routing: '{nha_cung_cap}' → ollama")
                self.ollama_model = nha_cung_cap  # dùng tên model trực tiếp
                nha_cung_cap = "ollama"

        if nha_cung_cap == "ollama":
            logger.info("🛡️ [Local AI] Ollama processing...")
            result = await self._call_ollama(text, the_loai)
        else:
            logger.info("☁️ [Cloud AI] Gemini processing...")
            try:
                start_time = time.time()
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None, lambda: self._call_gemini_with_retry(text, the_loai)
                )
                duration = time.time() - start_time
                logger.info(f"✅ [Cloud AI] Gemini finished in {duration:.2f}s")
            except Exception as e:
                logger.warning(f"Gemini failed ({e}). Falling back to Ollama...")
                result = await self._call_ollama(text, the_loai)

        if result:
            try:
                await redis_client.setex(cache_key, 86400, json.dumps(result))
            except Exception as e:
                logger.warning(f"⚠️ Redis write error: {e}")

        return result or {"nodes": [], "edges": []}

    async def _detect_diagram_intent(self, text: str, provider: str) -> str:
        """Sử dụng LLM để tự động phân loại yêu cầu của người dùng"""
        prompt = (
            "Dựa vào yêu cầu người dùng, hãy quyết định xem loại sơ đồ nào là phù hợp nhất.\n"
            "Chỉ trả về 1 từ duy nhất trong danh sách sau: 'org-chart', 'mindmap', 'uml', 'ioffice', 'layered', 'infrastructure', 'process'.\n"
            "Không giải thích thêm.\n"
            f"Văn bản: {text}"
        )
        try:
            if provider == "ollama":
                async with httpx.AsyncClient() as client:
                    payload = {
                        "model": self.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.0}
                    }
                    response = await client.post(self.ollama_url, json=payload, timeout=60.0)
                    if response.status_code == 200:
                        ans = response.json().get('response', '').strip().lower()
                        for t in ["org-chart", "mindmap", "uml", "ioffice", "layered", "infrastructure", "process"]:
                            if t in ans: return t
            else:
                current_client = self._get_current_client()
                response = current_client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.0)
                )
                ans = response.text.strip().lower()
                for t in ["org-chart", "mindmap", "uml", "ioffice", "layered", "infrastructure", "process"]:
                    if t in ans: return t
        except Exception as e:
            logger.warning(f"Auto-detect intent failed: {e}")
            
        return "process"

    async def _call_ollama(self, prompt: str, the_loai: str = "process") -> Dict[str, Any]:
        """Gọi AI nội bộ Ollama với Context-Aware prompt"""
        cfg = DIAGRAM_PROMPT_CONFIG.get(the_loai, _DEFAULT_CONFIG)
        strict_prompt = (
            f"{cfg['role']}\n"
            f"NHIỆM VỤ: Chuyển văn bản sau thành JSON React Flow.\n"
            f"Mỗi node phải có type='{cfg['node_types'][0]}' và data: {cfg['data_fields']}\n"
            f"RÀNG BUỘC: Strictly preserve all entities, locations, and names from user input. Do not generalize or swap locations (e.g., if user says 'Hà Tiên', do not output 'Hà Nội').\n"
            f"Văn bản: {prompt}"
        )

        start_time = time.time()
        async with httpx.AsyncClient() as client:
            payload = {
                "model": self.ollama_model,
                "prompt": strict_prompt,
                "stream": False,
                "format": "json",
                "options": self._current_config if hasattr(self, "_current_config") and self._current_config else {
                    "temperature": 0.2
                }
            }
            try:
                response = await client.post(self.ollama_url, json=payload, timeout=300.0)
                duration = time.time() - start_time
                if response.status_code != 200:
                    raise Exception(f"Ollama HTTP error {response.status_code}")
                result = response.json()
                raw_response = result.get('response', '')
                logger.info(f"✅ [Local AI] Ollama finished in {duration:.2f}s | Response: {raw_response[:100]}...")

                parsed = json.loads(raw_response)

                # Ollama đôi khi trả về {"nodes": [...], "edges": [...]}
                # hoặc bọc trong {"data": {"nodes": [...], "edges": [...]}}
                # Chuẩn hóa về dạng {"nodes": [...], "edges": [...]}
                if "data" in parsed and isinstance(parsed["data"], dict):
                    parsed = parsed["data"]

                # Đảm bảo luôn có keys nodes và edges
                if "nodes" not in parsed:
                    parsed["nodes"] = []
                if "edges" not in parsed:
                    parsed["edges"] = []

                # Thêm trường data nếu node thiếu (Ollama nhỏ hay bỏ qua)
                for node in parsed["nodes"]:
                    if "data" not in node:
                        node["data"] = {
                            "label": node.get("label", node.get("id", "Node")),
                            "executor": node.get("executor", ""),
                            "description": node.get("description", ""),
                        }
                    if "position" not in node:
                        node["position"] = {"x": 0, "y": 0}

                return parsed
            except httpx.ConnectError:
                raise Exception("KHONG THE KET NOI: Hay dam bao Ollama da duoc bat!")
            except json.JSONDecodeError as e:
                logger.error(f"[Ollama] JSON parse error: {e} | raw: {raw_response[:500]}")
                raise Exception(f"Ollama tra ve du lieu khong dung dinh dang JSON: {str(e)}")
            except Exception as e:
                logger.error(f"Ollama error: {str(e)}")
                raise e

    def _call_gemini_with_retry(self, text: str, the_loai: str = "process") -> Dict[str, Any]:
        try:
            client = self._get_current_client()
            prompt = self._build_system_prompt(text, the_loai)

            from pydantic import BaseModel, create_model, Field
            from typing import List, Optional, Dict

            # --- Schema Pydantic linh ho\u1ea1t: t\u1ea5t c\u1ea3 tr\u01b0\u1eddng extra \u0111\u1ec1u Optional ---
            # Thi\u1ebft k\u1ebf n\u00e0y tr\u00e1nh vi\u1ec7c AI b\u1ecb \u00e9p t\u1ea1o field kh\u00f4ng c\u00f3 trong d\u1eef li\u1ec7u
            NodeDataFields = {
                "label": (str, ...),
                "executor": (Optional[str], None),
                "description": (Optional[str], None),
                # Org-chart fields
                "position_title": (Optional[str], None),
                "department": (Optional[str], None),
                "level": (Optional[str], None),
                # UML fields
                "attributes": (Optional[List[str]], None),
                "methods": (Optional[List[str]], None),
                "uml_type": (Optional[str], None),
                "visibility": (Optional[str], None),
                # Process/iOffice fields
                "process_type": (Optional[str], None),
                "status": (Optional[str], None),
                "duration": (Optional[str], None),
                "document_ref": (Optional[str], None),
                # Mindmap fields
                "isRoot": (Optional[bool], None),
                "isExpanded": (Optional[bool], None),
                # Layered fields
                "layer_type": (Optional[str], None),
                "tech_stack": (Optional[List[str]], None),
            }

            DynamicNodeData = create_model("DynamicNodeData", **NodeDataFields)

            class CoordinateModel(BaseModel):
                x: float
                y: float

            class DynamicNode(BaseModel):
                id: str
                type: str
                position: CoordinateModel
                data: DynamicNodeData

            class EdgeModel(BaseModel):
                id: str
                source: str
                target: str
                label: Optional[str] = None
                type: Optional[str] = None

            class DiagramResponseSchema(BaseModel):
                nodes: List[DynamicNode]
                edges: List[EdgeModel]

            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json",
                    response_schema=DiagramResponseSchema,
                )
            )

            raw_text = response.text.strip()
            json_match = re.search(r'(\{.*\}|\[.*\])', raw_text, re.DOTALL)
            clean_json = json_match.group(0) if json_match else raw_text
            data = json.loads(clean_json)
            return self._post_processing(data)

        except Exception as e:
            logger.error(f"Gemini error at key {self.current_key_index}: {str(e)}")
            if ("429" in str(e) or "limit" in str(e).lower()) and \
               self.current_key_index < len(settings.GEMINI_API_KEYS) - 1:
                self.current_key_index += 1
                return self._call_gemini_with_retry(text, the_loai)
            raise e

    def _post_processing(self, data: Dict) -> Dict:
        """Chuẩn hóa dữ liệu từ AI để React Flow có thể hiển thị chính xác"""
        try:
            nodes: List[Dict[str, Any]] = []
            edges: List[Dict[str, Any]] = []

            if isinstance(data, dict):
                nodes = data.get("nodes") or data.get("node") or []
                edges = data.get("edges") or data.get("connections") or []
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and ("source" in item or "target" in item):
                        edges.append(item)
                    elif isinstance(item, dict):
                        nodes.append(item)

            if not nodes:
                nodes.append({
                    "id": "empty_node",
                    "type": "step",
                    "position": {"x": 250, "y": 150},
                    "data": {"label": "Sơ đồ rỗng (Hãy thử lại)", "executor": "Hệ thống"}
                })

            for i, node in enumerate(nodes):
                if not isinstance(node, dict): continue
                if "id" not in node: node["id"] = str(i + 1)
                if "position" not in node:
                    node["position"] = {"x": 250, "y": i * 150}

                node_data = node.get("data", {})
                raw_label = (
                    node_data.get("label") or
                    node.get("label") or
                    node_data.get("task") or
                    node_data.get("step_name") or
                    f"Bước {i + 1}"
                )

                # Preserve all existing data fields for context-aware nodes
                merged_data: Dict[str, Any] = dict(node_data)
                merged_data["label"] = raw_label
                if "executor" not in merged_data:
                    merged_data["executor"] = node.get("executor", "Chưa xác định")
                if "description" not in merged_data:
                    merged_data["description"] = node.get("description", "")
                node["data"] = merged_data

            for j, edge in enumerate(edges):
                if not isinstance(edge, dict): continue
                if "id" not in edge:
                    src = edge.get("source")
                    tgt = edge.get("target")
                    edge["id"] = f"e{src}-{tgt}-{j}"

            return {"nodes": nodes, "edges": edges}

        except Exception as ex:
            logger.exception(f"Post-processing error: {ex}")
            return {"nodes": [], "edges": []}

    def _get_mock_erp_data(self):
        """Hàm dự phòng khi demo"""
        return {
            "nodes": [
                {"id": "1", "type": "process", "data": {"label": "Khởi tạo ERP", "executor": "Ban Giám Đốc", "process_type": "start"}, "position": {"x": 250, "y": 0}},
                {"id": "2", "type": "process", "data": {"label": "Khảo sát hiện trạng", "executor": "Phòng CNTT", "process_type": "step"}, "position": {"x": 250, "y": 150}},
            ],
            "edges": [{"id": "e1-2", "source": "1", "target": "2"}]
        }

    async def generate_flow_from_image(
        self, image_content: bytes, content_type: str, the_loai: str = "process"
    ) -> Dict[str, Any]:
        """Vision AI - ph\u00e2n t\u00edch h\u00ecnh \u1ea3nh s\u01a1 \u0111\u1ed3 b\u1eb1ng Gemini multimodal"""
        try:
            cfg = DIAGRAM_PROMPT_CONFIG.get(the_loai, _DEFAULT_CONFIG)
            node_type = cfg.get("node_types", ["process"])[0]
            data_fields = cfg.get("data_fields", '{ "label": "T\u00ean b\u01b0\u1edbc" }')

            client = self._get_current_client()
            image_part = types.Part.from_bytes(data=image_content, mime_type=content_type)

            prompt_text = (
                f"B\u1ea1n l\u00e0 chuy\u00ean gia ph\u00e2n t\u00edch s\u01a1 \u0111\u1ed3 t\u1ea1i VNPT.\n\n"
                f"H\u00e3y ph\u00e2n t\u00edch k\u1ef9 h\u00ecnh \u1ea3nh n\u00e0y v\u00e0 th\u1ef1c hi\u1ec7n:\n"
                f"1. Nh\u1eadn di\u1ec7n TH\u1ee4C TH\u1ec2 t\u1eeb \u1ea3nh (c\u00e1c h\u1ed9p, n\u00fat, k\u1ebft n\u1ed1i, c\u00e1c b\u01b0\u1edbc).\n"
                f"2. Chuy\u1ec3n \u0111\u1ed5i th\u00e0nh JSON React Flow v\u1edbi c\u1ea5u tr\u00fac {{\"nodes\": [...], \"edges\": [...]}}.\n"
                f"3. M\u1ed7i node MUST c\u00f3 c\u1ea5u tr\u00fac:\n"
                f"   {{\"id\": \"1\", \"type\": \"{node_type}\", \"position\": {{\"x\": 0, \"y\": 0}}, \"data\": {data_fields}}}\n\n"
                f"QUY T\u1eaec NODE TYPE:\n"
                f"- Lo\u1ea1i s\u01a1 \u0111\u1ed3 \u0111\u01b0\u1ee3c y\u00eau c\u1ea7u: '{the_loai}'\n"
                f"- T\u1ea5t c\u1ea3 nodes MUST d\u00f9ng type='{node_type}'.\n\n"
                f"QUY T\u1eaec EDGES:\n"
                f"- M\u1ed7i edge: {{\"id\": \"e1-2\", \"source\": \"1\", \"target\": \"2\", \"label\": \"T\u00ean k\u1ebft n\u1ed1i (n\u1ebfu c\u00f3)\"}}\n\n"
                f"TR\u1ea2 V\u1ec0 DUY NH\u1ea4T 1 KH\u1ed0I JSON H\u1ee2P L\u1ec6. KH\u00d4NG markdown (```), kh\u00f4ng gi\u1ea3i th\u00edch."
            )

            response = client.models.generate_content(
                model=self.model_name,
                contents=[image_part, prompt_text],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json",
                ),
            )

            raw_text = response.text.strip()
            json_match = re.search(r'(\{.*\})', raw_text, re.DOTALL)
            clean_json = json_match.group(0) if json_match else raw_text
            data = json.loads(clean_json)
            result = self._post_processing(data)
            logger.info(
                f"[Vision AI] Nh\u1eadn di\u1ec7n \u1ea3nh th\u00e0nh c\u00f4ng: "
                f"{len(result.get('nodes', []))} nodes, {len(result.get('edges', []))} edges"
            )
            return result

        except Exception as e:
            logger.error(f"Vision AI error: {e}")
            raise e


ai_service = AIService()