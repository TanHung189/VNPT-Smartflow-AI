# PROJECT_STATUS.md — VNPT SmartFlow AI

> **Mục đích tài liệu:** Tổng hợp toàn bộ trạng thái hiện tại của dự án để đồng bộ ngữ cảnh với các cộng tác viên AI và giảng viên.  
> **Cập nhật lần cuối:** 2026-04-13 | **Tác giả:** Bùi Đổ Tấn Hưng (Thực tập VNPT) | **Phiên bản:** 1.4.0

---

## 1. Tổng quan dự án (Project Overview)

**VNPT SmartFlow AI** là hệ thống hỗ trợ thiết kế sơ đồ quy trình nghiệp vụ thông minh, được phát triển phục vụ nội bộ tập đoàn **VNPT** trong khuôn khổ chương trình thực tập kỹ thuật. Hệ thống cho phép cán bộ nghiệp vụ mô tả quy trình bằng văn bản tiếng Việt hoặc hình ảnh, và AI sẽ tự động chuyển đổi thành sơ đồ quy trình tương tác được (interactive flowchart).

### Bộ công nghệ chính (Core Tech Stack)

| Lớp                  | Công nghệ                                                        | Phiên bản                                   |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| **Backend API**      | FastAPI + Uvicorn                                                | 0.133.1 / 0.41.0                            |
| **AI Engine**        | Google Gemini API (`gemini-3-flash-preview`, `gemini-1.5-flash`) | `google-generativeai==0.8.6`                |
| **Frontend**         | React 18 + TypeScript + Vite                                     | -                                           |
| **Graph Rendering**  | React Flow (`@xyflow/react`) + Dagre (`@dagrejs/dagre`)          | -                                           |
| **Database**         | PostgreSQL + SQLAlchemy 2.0 Async + SQLModel                     | 2.0.48 / 0.0.37                             |
| **Cache**            | Redis (`redis-py`)                                               | TTL: 5 phút (diagrams), 24 giờ (AI results) |
| **Auth**             | JWT (`python-jose`) + Google OAuth 2.0                           | -                                           |
| **Styling**          | TailwindCSS + Lucide Icons                                       | -                                           |
| **Containerization** | Docker Compose _(планується)_                                    | -                                           |

---

## 2. Kiến trúc hệ thống (System Architecture)

```
┌─────────────────────────── FRONTEND (React / Vite) ──────────────────────────────┐
│  DrawDiagram.tsx  ──►  useFlowLogic.ts (Dagre layout + history)                  │
│  FlowCanvas       ──►  SmartNode.tsx / React Flow                                │
│  diagramApi.ts    ──►  Gọi REST API với Bearer JWT token                         │
└────────────────────────────┬─────────────────────────────────────────────────────┘
                             │ HTTP (JSON)
┌────────────────────────────▼─────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI — port 8000)                                  │
│                                                                                  │
│  ┌── API ROUTER ───────────────────────────────────────────────────────────┐     │
│  │   /auth/*          → auth.py (Login / Register / Google OAuth)         │     │
│  │   /generate-flow   → flow.py (Text → AI → React Flow JSON)             │     │
│  │   /upload-process  → flow.py (File TXT/DOCX/PDF → AI → JSON)           │     │
│  │   /generate-flow-from-image → flow.py (Image → Vision AI → JSON)       │     │
│  │   /diagrams/*      → diagram_router.py (CRUD PostgreSQL + Redis)       │     │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
│  ┌── SERVICE LAYER ───────────────────────────────────────────────────────┐      │
│  │   ai_service.py    → Gemini API call + Redis AI cache (24h, hashlib)  │      │
│  │   diagram_service.py → CRUD logic + Redis diagram cache (5 phút)      │      │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
│  ┌── DATABASE / CACHE ────────────────────────────────────────────────────┐      │
│  │   PostgreSQL (asyncpg)  ──► Bảng: users, diagrams_v2, ...             │      │
│  │   Redis                 ──► AI result cache + Diagram list/detail cache│      │
│  └─────────────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Tích hợp Redis — 2 lớp cache độc lập

```
Layer 1 — AI Cache (ai_service.py):
  Key: vnpt:flow:text:{md5(text)}   TTL: 86400s (24h)
  Key: vnpt:flow:image:{md5(bytes)} TTL: 86400s (24h)

Layer 2 — Diagram Cache (diagram_service.py):
  Key: diag_list:{user_id}              TTL: 300s (5 phút)  → GET /diagrams/list
  Key: diag_one:{user_id}:{diagram_id} TTL: 300s (5 phút)  → GET /diagrams/{id}
  Invalidation: DELETE cả 2 key sau mỗi POST/PUT/DELETE thành công
```

---

## 3. Tính năng đã hoàn thiện (Status: ✅ DONE)

### 3.1 Text-to-Flow (Văn bản → Sơ đồ)

- **Endpoint:** `POST /generate-flow?text=...`
- **Luồng:** Frontend gửi văn bản → `ai_service.generate_smart_flow()` → Kiểm tra Redis cache → Nếu miss: gọi Gemini API với `temperature=0.2` → Parse JSON → `_post_processing()` normalize → Lưu Redis 24h → Trả về.
- **Prompt kỹ thuật:** Ép AI phân loại node theo 4 loại nghiệp vụ: `start`, `step`, `decision`, `end`.
- **Retry logic:** Tự động chuyển sang API key tiếp theo khi gặp lỗi 429 (rate limit).

### 3.2 Image-to-Flow (Hình ảnh → Sơ đồ)

- **Endpoint:** `POST /generate-flow-from-image`
- **Mô hình:** `gemini-1.5-flash` (hỗ trợ multimodal Vision).
- **Xử lý ảnh mờ:** Nếu AI không nhận diện được, trả về JSON `{"error": "..."}` thay vì crash.
- **Cache:** Key theo `md5(image_bytes)` → Tránh gọi AI lặp lại khi cùng file ảnh.

### 3.3 File Upload (TXT / DOCX / PDF → Sơ đồ)

- **Endpoint:** `POST /upload-process`
- **Parser:** PyPDF2 (PDF), python-docx (DOCX), UTF-8 decode (TXT).
- **Bảo vệ log:** Tắt verbose log của `PyPDF2.generic._data_structures` để tránh noise.

### 3.4 CRUD Sơ đồ (PostgreSQL + Redis)

- **Router mới:** `diagram_router.py` (tách biệt hoàn toàn khỏi AI router).
- **5 Endpoint hoàn chỉnh:**
  - `POST /diagrams/save` → HTTP 201, tạo bản ghi mới, xóa cache list.
  - `GET /diagrams/list` → Đọc Redis trước, fallback PostgreSQL.
  - `GET /diagrams/{id}` → Cache chi tiết 5 phút, trả 404 nếu không thuộc user.
  - `PUT /diagrams/{id}` → Cập nhật + xóa cả 2 Redis key.
  - `DELETE /diagrams/{id}` → Xóa DB + xóa Redis.
- **Pattern:** Mọi endpoint có `try-except`, `logger.info/warning/error(exc_info=True)`, và `HTTPException` chuẩn REST.

### 3.5 JWT Authentication

- **Endpoint:** `POST /auth/login` (OAuth2PasswordRequestForm), `POST /auth/register`, `POST /auth/google`.
- **Guard:** `get_current_user` dependency trong `dependency.py` → giải mã JWT → truy vấn DB → trả `User` object.
- **Bảo mật:** Mật khẩu hash bằng bcrypt (`get_password_hash`), token dùng HS256.

### 3.6 Dagre Auto-Layout + Canvas

- **Layout engine:** `@dagrejs/dagre` với `rankdir: "TB"`, `nodesep: 100`, `ranksep: 120`.
- **Node dimensions:** `width=280, height=160` (đăng ký với Dagre để tránh overlap).
- **Tọa độ số nguyên:** `Math.round(x - 140), Math.round(y - 80)` — tránh lỗi mũi tên gãy do tọa độ thập phân.
- **Handle centering:** `style={{ left: "50%", transform: "translateX(-50%)" }}` trên cả Target và Source Handle.

### 3.7 Tính năng Canvas nâng cao

- **Freehand Drawing:** `DrawingCanvas.tsx` với Pen / Eraser / Selection mode.
- **Undo / Redo:** History stack tối đa 50 snapshot, lưu cả nodes + edges + strokes.
- **Drag & Drop:** Node creation từ Sidebar kéo thả vào Canvas.
- **Node Edit:** Click chọn node → Sidebar hiển thị form chỉnh sửa `label / executor / description`.

---

## 4. Đang phát triển (Status: 🔄 WIP)

### 4.1 Google OAuth COOP Policy

- **Lỗi:** `Cross-Origin-Opener-Policy policy would block the window.postMessage call.`
- **Nguyên nhân:** Trình duyệt chặn popup của Google Sign-In do chính sách `COOP: same-origin` không tương thích với `window.postMessage` cross-origin.
- **Trạng thái:** _Chưa xử lý_. Cần thêm header `Cross-Origin-Opener-Policy: same-origin-allow-popups` trong response FastAPI CORS hoặc dùng redirect flow thay vì popup flow.

### 4.2 Frontend API Integration hoàn chỉnh

- `getAll()` trong `diagramApi.ts` (gọi `/diagrams/list`) chưa được dùng trong UI — cần tích hợp vào trang quản lý sơ đồ.
- Chưa có trang `My Diagrams` để người dùng xem danh sách và load lại sơ đồ đã lưu.

### 4.3 FutureWarning — google-generativeai

- **Cảnh báo:** `FutureWarning: All support for the 'google.generativeai' package has ended.`
- **Nguyên nhân:** Đang dùng SDK cũ `google-generativeai==0.8.6` thay vì `google-genai` mới.
- **Trạng thái:** _Chưa migrate_. Cần refactor `ai_service.py` sang `from google import genai` API mới.

---

## 5. Lỗi đã biết (Known Bugs & Issues)

| #   | Lỗi                                                                 | Nguyên nhân                                                                                  | Trạng thái                                                                  |
| --- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | `ImportError: cannot import name 'get_session' from 'app.database'` | `dependency.py` và `__init__.py` dùng `get_session`, nhưng `session.py` định nghĩa `get_db`. | ✅ **Đã sửa** — Đồng bộ về `get_db`                                         |
| 2   | Frontend 404 khi lưu sơ đồ (`/save-diagram`)                        | `diagramApi.ts` hardcode endpoint cũ, chưa cập nhật theo router mới `/diagrams/save`         | ✅ **Đã sửa** — Đổi sang `/diagrams/save`                                   |
| 3   | Mũi tên gãy hình chữ Z                                              | Handle không được căn giữa tuyệt đối do box-model CSS                                        | ✅ **Đã sửa** — Thêm `style={{ left:'50%', transform:'translateX(-50%)' }}` |
| 4   | `COOP: window.postMessage` blocked                                  | Google OAuth popup bị chặn bởi browser security policy                                       | ⚠️ WIP                                                                      |
| 5   | `FutureWarning: google-generativeai deprecated`                     | Dùng SDK cũ thay vì `google-genai`                                                           | ⚠️ WIP                                                                      |
| 6   | Response field mismatch                                             | Frontend expect `diagram_id`, backend trả `id`                                               | ✅ **Đã sửa** — Frontend đọc `result.id`                                    |

---

## 6. Lộ trình tương lai (Roadmap)

| Ưu tiên  | Tính năng                           | Mô tả                                                                        | Phụ thuộc                |
| -------- | ----------------------------------- | ---------------------------------------------------------------------------- | ------------------------ |
| 🔴 Cao   | **Migrate sang `google-genai` SDK** | Xóa deprecated warning, đảm bảo long-term support                            | `ai_service.py` refactor |
| 🔴 Cao   | **Trang "My Diagrams"**             | UI để xem danh sách, load lại và xóa sơ đồ                                   | `/diagrams/list` đã có   |
| 🔴 Cao   | **Fix COOP Google OAuth**           | Thêm header `same-origin-allow-popups` hoặc chuyển sang redirect flow        | FastAPI CORS/middleware  |
| 🟡 Trung | **Export PNG / PDF**                | Dùng `html2canvas` + `jsPDF` để xuất sơ đồ                                   | Frontend                 |
| 🟡 Trung | **Collaboration (Real-time)**       | WebSocket để nhiều người cùng chỉnh sơ đồ                                    | FastAPI WebSocket        |
| 🟡 Trung | **Docker Compose deployment**       | Đóng gói toàn bộ (FastAPI + PostgreSQL + Redis) thành 1 `docker-compose.yml` | DevOps                   |
| 🟢 Thấp  | **Diagram Versioning**              | Lưu lịch sử thay đổi vào bảng `diagram_history`                              | Schema đã có             |
| 🟢 Thấp  | **Admin Dashboard**                 | Thống kê số lượng sơ đồ, users, AI call                                      | RBAC đã có               |

---

## 7. Cấu trúc thư mục (Project Organization)

```
VNPT-Smartflow-AI/
├── backend/
│   ├── .env                          # API keys, DB_URL, JWT secrets
│   ├── requirements.txt              # Python dependencies
│   ├── alembic.ini                   # Cấu hình Alembic migration
│   ├── test_diagram_api.py           # Integration test script (7 CRUD steps)
│   └── app/
│       ├── main.py                   # FastAPI app, CORS middleware, lifespan
│       ├── api/
│       │   ├── router.py             # Gom tất cả sub-router
│       │   ├── dependency.py         # get_current_user (JWT guard)
│       │   └── endpoints/
│       │       ├── auth.py           # /auth/* — Login, Register, Google OAuth
│       │       ├── users.py          # /users/* — Quản lý user (WIP)
│       │       ├── flow.py           # /generate-flow, /upload-process, /generate-flow-from-image
│       │       └── diagram_router.py # /diagrams/* — CRUD hoàn chỉnh + Redis cache
│       ├── services/
│       │   ├── ai_service.py         # Gemini API wrapper + AI Redis cache (hashlib keys)
│       │   └── diagram_service.py    # CRUD logic tầng Service + Diagram Redis cache
│       ├── models/
│       │   ├── __init__.py           # Export tất cả models
│       │   ├── user.py               # Bảng users
│       │   ├── diagram.py            # Bảng diagrams_v2 (UUID PK, JSONB flow_data)
│       │   └── diagram_history.py    # Bảng lưu lịch sử (Roadmap)
│       ├── schemas/
│       │   ├── diagram.py            # DiagramCreate, DiagramUpdate, DiagramResponse, DiagramListResponse
│       │   └── auth.py               # Token, UserCreate, GoogleLoginRequest
│       ├── database/
│       │   ├── __init__.py           # Export get_db
│       │   ├── session.py            # AsyncEngine + get_db() generator
│       │   └── base.py               # SQLModel Base class
│       └── core/
│           ├── config.py             # Settings: GEMINI_API_KEYS list, JWT, DB_URL, PORT
│           ├── redis.py              # redis_client (host=localhost, decode_responses=True)
│           └── security.py          # bcrypt hash, create_access_token, verify_password
│
└── frontend/
    ├── .env                          # REACT_APP_API_URL / VITE_API_URL
    ├── vite.config.ts                # Vite build config
    └── src/
        ├── App.tsx                   # Root routing (React Router)
        ├── env.ts                    # Export API_URL từ import.meta.env
        ├── hooks/
        │   └── useFlowLogic.ts       # ⭐ Core hook: Dagre layout, undo/redo, draw mode, CRUD calls
        ├── components/
        │   ├── SmartNode.tsx         # Custom node component với Handles căn giữa
        │   ├── Toolbar.tsx           # Bộ nút công cụ canvas
        │   └── DrawingCanvas.tsx     # Freehand drawing (Pen/Eraser)
        ├── features/
        │   ├── flow/                 # FlowCanvas, edge types, panel
        │   └── chat/                 # Sidebar nhập prompt AI
        ├── pages/
        │   ├── DrawDiagram.tsx       # Trang canvas chính + nút LƯU
        │   └── Login.tsx / Dashboard.tsx / ...
        └── services/
            ├── diagramApi.ts         # REST client: /diagrams/save, /diagrams/list, generate-flow
            └── authApi.ts            # REST client: /auth/login, /auth/register
```

---

## 8. Các hàm/module trọng yếu (Key Technical Notes)

### `ai_service.py — AIService`

| Method                                  | Ý nghĩa                                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `generate_smart_flow(text)`             | Entry point Text→Flow. Check Redis **trước** bằng MD5 hash của text.                                                 |
| `generate_flow_from_image(bytes, mime)` | Entry point Image→Flow. Check Redis bằng MD5 hash của raw bytes.                                                     |
| `_call_gemini_with_retry(text)`         | Gọi Gemini `gemini-3-flash-preview`, temperature=0.2, auto-switch key khi 429.                                       |
| `_call_gemini_vision_with_retry(...)`   | Gọi `gemini-1.5-flash` với multipart [prompt + image], temperature=0.1.                                              |
| `_post_processing(data)`                | Normalize AI output: đảm bảo mỗi node có `id`, `position`, `type`, `data`. Không crash khi AI trả list thay vì dict. |

### `diagram_service.py` (Service Layer)

| Function                 | Ý nghĩa                                                                         |
| ------------------------ | ------------------------------------------------------------------------------- |
| `create_diagram()`       | INSERT + commit + xóa cache `diag_list:{user_id}`                               |
| `get_diagrams_by_user()` | Redis HIT → trả ngay. MISS → SELECT ORDER BY updated_at DESC + SET cache 5 phút |
| `get_diagram_by_id()`    | Cache chi tiết, kiểm tra user ownership                                         |
| `update_diagram()`       | UPDATE + commit + xóa cả `diag_list` & `diag_one`                               |
| `delete_diagram()`       | DELETE + commit + xóa cả `diag_list` & `diag_one`                               |

### `useFlowLogic.ts` (Frontend Hook)

| Export                    | Ý nghĩa                                                                   |
| ------------------------- | ------------------------------------------------------------------------- |
| `getLayoutedElements()`   | Dùng Dagre, offset `Math.round(x-140, y-80)` → tọa độ số nguyên tuyệt đối |
| `generateFlow(text)`      | Gọi `diagramApi.generateFlowText()` → normalize → layout → setNodes/Edges |
| `takeSnapshot()`          | Lưu `{nodes, edges, strokes}` vào history stack (max 50)                  |
| `undo() / redo()`         | Pop history stack → restore state                                         |
| `addStroke() / eraseAt()` | Quản lý freehand strokes (Pen / Eraser)                                   |

---

## 9. Hướng dẫn khởi động (Quick Start)

```bash
# 1. Backend
cd "d:\THUC TAP\VNPT-Smartflow-AI\backend"
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# 2. Frontend
cd "d:\THUC TAP\VNPT-Smartflow-AI\frontend"
npm run dev

# 3. Chạy Integration Test (backend phải đang chạy)
cd "d:\THUC TAP\VNPT-Smartflow-AI\backend"
.venv\Scripts\python.exe test_diagram_api.py
```

**Yêu cầu môi trường:**

- Redis Server đang chạy tại `localhost:6379`
- PostgreSQL tại URL được cấu hình trong `.env` (`DB_URL`)
- File `.env` có `GEMINI_API_KEY_1`, `JWT_SECRET_KEY`, `PORT=8000`

---

_Tài liệu này được tạo tự động bởi Antigravity AI Assistant theo yêu cầu của kỹ sư thực tập._

database bảng và cột postgresql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE mo_hinh_ai (
id_mo_hinh SERIAL PRIMARY KEY,
nha_cung_cap VARCHAR(50) NOT NULL,
ten_mo_hinh VARCHAR(100) UNIQUE NOT NULL,
mo_ta TEXT,
trang_thai_hoat_dong BOOLEAN DEFAULT true,
ngay_tao TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vai_tro (
id_vai_tro SERIAL PRIMARY KEY,
ten_vai_tro VARCHAR(50) UNIQUE NOT NULL,
mo_ta TEXT,
quyen_han JSONB DEFAULT '{}',
ngay_tao TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nguoi_dung (
id_nguoi_dung UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ten_nguoi_dung VARCHAR(100) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
mat_khau_ma_hoa TEXT,
id_vai_tro INT REFERENCES vai_tro(id_vai_tro) ON DELETE SET NULL,
ten_phong_ban VARCHAR(100),
anh_dai_dien TEXT,
trang_thai_hoat_dong BOOLEAN DEFAULT true,
lan_dang_nhap_cuoi TIMESTAMP,
ngay_tao TIMESTAMP DEFAULT NOW(),
ngay_cap_nhat TIMESTAMP DEFAULT NOW(),
ngay_xoa TIMESTAMP
);

CREATE TABLE xac_thuc_nguoi_dung (
id_xac_thuc SERIAL PRIMARY KEY,
id_nguoi_dung UUID REFERENCES nguoi_dung(id_nguoi_dung) ON DELETE CASCADE,
nha_cung_cap VARCHAR(50) NOT NULL,
id_nguoi_dung_cung_cap TEXT NOT NULL,
UNIQUE(nha_cung_cap, id_nguoi_dung_cung_cap)
);

CREATE TABLE token_lam_moi (
id_token SERIAL PRIMARY KEY,
id_nguoi_dung UUID REFERENCES nguoi_dung(id_nguoi_dung) ON DELETE CASCADE,
gia_tri_token TEXT NOT NULL UNIQUE,
ngay_het_han TIMESTAMP NOT NULL,
bi_thu_hoi BOOLEAN DEFAULT false,
ngay_tao TIMESTAMP DEFAULT NOW()
);

CREATE TABLE so_do (
id_so_do UUID PRIMARY KEY DEFAULT gen_random_uuid(),
id_chu_so_huu UUID REFERENCES nguoi_dung(id_nguoi_dung) ON DELETE CASCADE,
tieu_de VARCHAR(255) NOT NULL,
the_loai VARCHAR(50) NOT NULL,
van_ban_dau_vao TEXT,
du_lieu_so_do JSONB NOT NULL DEFAULT '{}'::jsonb,
anh_thu_nho TEXT,
la_noi_bo BOOLEAN DEFAULT false,
la_mau_chuan BOOLEAN DEFAULT false,
ngay_tao TIMESTAMP DEFAULT NOW(),
ngay_cap_nhat TIMESTAMP DEFAULT NOW(),
ngay_xoa TIMESTAMP
);

CREATE TABLE phien_ban_so_do (
id_phien_ban UUID PRIMARY KEY DEFAULT gen_random_uuid(),
id_so_do UUID REFERENCES so_do(id_so_do) ON DELETE CASCADE,
du_lieu_so_do JSONB NOT NULL,
ly_do_thay_doi TEXT,
ngay_tao TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nhat_ky_he_thong (
id_nhat_ky BIGSERIAL PRIMARY KEY,
id_nguoi_dung UUID REFERENCES nguoi_dung(id_nguoi_dung) ON DELETE SET NULL,
hanh_dong VARCHAR(100) NOT NULL,
bang_bi_anh_huong VARCHAR(50),
id_ban_ghi UUID,
chi_tiet JSONB,
dia_chi_ip VARCHAR(45),
ngay_tao TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nhat_ky_su_dung_ai (
id_nhat_ky BIGSERIAL PRIMARY KEY,
id_nguoi_dung UUID REFERENCES nguoi_dung(id_nguoi_dung) ON DELETE SET NULL,
id_mo_hinh INT REFERENCES mo_hinh_ai(id_mo_hinh) ON DELETE SET NULL,
so_token_dau_vao INT DEFAULT 0,
so_token_dau_ra INT DEFAULT 0,
thoi_gian_xu_ly_ms INT,
trang_thai VARCHAR(20),
ngay_tao TIMESTAMP DEFAULT NOW()
);
-- Kiểm tra cấu hình hệ thống
SELECT _ FROM mo_hinh_ai;
SELECT _ FROM vai_tro;

-- Kiểm tra thông tin người dùng và xác thực
SELECT _ FROM nguoi_dung;
SELECT _ FROM xac_thuc_nguoi_dung;
SELECT \* FROM token_lam_moi;

-- Kiểm tra dữ liệu sơ đồ và lịch sử
SELECT _ FROM so_do;
SELECT _ FROM phien_ban_so_do;

-- Kiểm tra nhật ký và truy vết
SELECT _ FROM nhat_ky_he_thong;
SELECT _ FROM nhat_ky_su_dung_ai;
CREATE INDEX ix_nguoi_dung_email ON nguoi_dung(email);
CREATE INDEX ix_so_do_chu_so_huu ON so_do(id_chu_so_huu);
CREATE INDEX ix_so_do_ngay_xoa ON so_do(ngay_xoa);

CREATE OR REPLACE FUNCTION cap_nhat_thoi_gian()
RETURNS TRIGGER AS $$
BEGIN
NEW.ngay_cap_nhat = NOW();
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER trigger_cap_nhat_nguoi_dung BEFORE UPDATE ON nguoi_dung FOR EACH ROW EXECUTE PROCEDURE cap_nhat_thoi_gian();
CREATE TRIGGER trigger_cap_nhat_so_do BEFORE UPDATE ON so_do FOR EACH ROW EXECUTE PROCEDURE cap_nhat_thoi_gian();

INSERT INTO vai_tro (ten_vai_tro, mo_ta) VALUES
('quan_tri', 'Quản trị viên toàn hệ thống'),
('nhan_vien', 'Sử dụng chung cho tất cả cán bộ, nhân viên VNPT')
ON CONFLICT (ten_vai_tro) DO NOTHING;

INSERT INTO mo_hinh_ai (nha_cung_cap, ten_mo_hinh, mo_ta) VALUES
('gemini', 'gemini-1.5-flash', 'AI xử lý nhanh trên Cloud'),
('ollama', 'qwen2.5-coder:3b', 'AI nội bộ bảo mật cao')
ON CONFLICT (ten_mo_hinh) DO NOTHING;
$$
