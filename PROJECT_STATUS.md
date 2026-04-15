# PROJECT_STATUS.md — VNPT SmartFlow AI
> **Mục đích tài liệu:** Tổng hợp toàn bộ trạng thái hiện tại của dự án để đồng bộ ngữ cảnh với các cộng tác viên AI và giảng viên.
> **Cập nhật lần cuối:** 2026-04-15 | **Tác giả:** Bùi Đổ Tấn Hưng (Thực tập VNPT) | **Phiên bản:** 1.5.0

---

## 1. Tổng quan dự án (Project Overview)

**VNPT SmartFlow AI** là hệ thống hỗ trợ thiết kế sơ đồ quy trình nghiệp vụ thông minh, được phát triển phục vụ nội bộ tập đoàn **VNPT** trong khuôn khổ chương trình thực tập kỹ thuật. Hệ thống cho phép cán bộ nghiệp vụ mô tả quy trình bằng văn bản tiếng Việt hoặc hình ảnh, và AI sẽ tự động chuyển đổi thành sơ đồ quy trình tương tác được (interactive flowchart).

### Bộ công nghệ chính (Core Tech Stack)

| Lớp | Công nghệ | Phiên bản |
|-----|-----------|-----------|
| **Backend API** | FastAPI + Uvicorn | 0.133.1 / 0.41.0 |
| **AI Engine** | Google Gemini API (`gemini-3-flash-preview`, `gemini-1.5-flash`) | `google-generativeai==0.8.6` |
| **Frontend** | React 19 + TypeScript + CRACO | - |
| **Graph Rendering** | React Flow (`@xyflow/react`) + Dagre (`@dagrejs/dagre`) | - |
| **Database** | PostgreSQL + SQLAlchemy 2.0 Async + SQLModel | 2.0.48 / 0.0.37 |
| **Cache** | Redis (`redis-py`) | TTL: 5 phút (diagrams), 24 giờ (AI results) |
| **Auth** | JWT (`python-jose`) + Google OAuth 2.0 | - |
| **Styling** | TailwindCSS + Lucide Icons + Framer Motion | - |

---

## 2. Thay đổi Kiến trúc & UI/UX Chính (v1.5.0)

### 2.1 Loại bỏ Vite, chuyển sang CRACO (Webpack)
- Hệ thống đã chính thức **loại bỏ Vite** để chạy thuần túy trên **CRACO (Webpack)**.
- Thống nhất sử dụng `craco.config.js` với module resolution (`@/*` alias).
- Chuyển từ `import.meta.env` sang `process.env`.
- **Trạng thái:** Dự án biên dịch (Production Build) ổn định, `npm run build` pass 100%.

### 2.2 "Miro-Style" UI Canvas
- Giao diện được nâng cấp chuyên nghiệp như một Enterprise App:
  1. **Top Header:** Chứa Title, Nút Drawer Lịch Sử, Status AI Processing, và các cụm Lưu/Xuất.
  2. **Left Vertical Toolbar:** Dời toàn bộ công cụ (Kéo thả Node, Select, Nối dây, Export, Đổi màu Pen) dọc theo cạnh trái. Tích hợp nút **Sparkles AI** nổi bật.
  3. **Canvas Animation (Skeleton Node):** Hiển thị "Pulse Nodes" (dash line) khi AI đang xử lý thay vì màn hình loading đơn điệu.

### 2.3 Dual-Mode AI Assistant
- **Mode 1: Center Modal:** Bấm vào `Sparkles` → Bật Modal căn giữa với 3 Card Template (Lắp đặt cáp quang, Hỗ trợ xử lý, Triển khai OLT).
- **Mode 2: Floating Chatbox:** Sau khi gửi yêu cầu, modal thu về Mini Widget ở góc dưới bên phải với giao diện Glassmorphism.

### 2.4 History Drawer (Lịch sử Bản nháp)
- Sử dụng `Sheet` (HistoryDrawer) trượt từ bên trái, kích hoạt qua icon Hamburger Menu tại Top Header.

---

## 3. Kiến trúc hệ thống (System Architecture)

```
┌─────────────────────────── FRONTEND (React / CRACO) ─────────────────────────────┐
│  DrawDiagram.tsx  ──►  useFlowLogic.ts (Dagre layout + history)                  │
│  FlowCanvas       ──►  SmartNode.tsx / React Flow / Skeleton Loading             │
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

---

## 4. Tính năng đã hoàn thiện (Status: ✅ DONE)

- **Text-to-Flow:** Phân loại node (start, step, decision, end), auto-layout Dagre.
- **Image-to-Flow:** Hỗ trợ multimodal Vision (Gemini 1.5 Flash), xử lý ảnh mờ.
- **File Upload:** Parser PDF, DOCX, TXT.
- **CRUD Sơ đồ:** PostgreSQL + 2 lớp Redis cache (AI Cache 24h, Diagram Cache 5p).
- **JWT Authentication:** Local login & Google OAuth (Backend core done).
- **Canvas Nâng cao:** 
  - Miro-style UI với Top Header và Vertical Toolbar.
  - Freehand Drawing (Pen/Eraser), Undo/Redo (50 snapshots).
  - Drag & Drop Node, Node Edit Sidebar.
  - Animation `framer-motion` & Skeleton Loading.

---

## 5. Đang phát triển & Lỗi tồn đọng (Status: 🔄 WIP / ⚠️ Issues)

| # | Vấn đề | Chi tiết | Ưu tiên |
|---|--------|----------|---------|
| 1 | **Google OAuth COOP Policy** | Browser chặn popup do thiếu header `same-origin-allow-popups` trong FastAPI. | 🔴 Cao |
| 2 | **FutureWarning genai SDK** | Gói `google-generativeai` cũ, cần migrate sang `google-genai`. | 🔴 Cao |
| 3 | **Trang "My Diagrams"** | Chưa có trang quản lý danh sách full-screen (mới có History Drawer). | 🟡 Trung |
| 4 | **Export PNG / PDF** | Đang tích hợp `html2canvas` / `jsPDF`. | 🟡 Trung |

---

## 6. Lộ trình tương lai (Roadmap)
- [ ] Migrate sang `google-genai` SDK.
- [ ] Fix COOP Google OAuth Policy.
- [ ] Phát triển trang Dashboard / "My Diagrams" hoàn chỉnh.
- [ ] Collaboration (Real-time) qua WebSocket.
- [ ] Docker Compose deployment.
- [ ] Diagram Versioning.

---

## 7. Cấu trúc thư mục (Project Organization)

```
VNPT-Smartflow-AI/
├── backend/
│   ├── app/
│   │   ├── api/endpoints/ (auth.py, flow.py, diagram_router.py)
│   │   ├── services/ (ai_service.py, diagram_service.py)
│   │   └── models/ (user.py, diagram.py)
├── frontend/
│   ├── craco.config.js               # Cấu hình Webpack alias @/
│   └── src/
│       ├── pages/DrawDiagram.tsx     # Root Layout (Header, Toolbar, Canvas)
│       ├── features/
│       │   ├── flow/FlowCanvas.tsx   # React Flow + Skeleton State
│       │   └── chat/Sidebar.tsx      # Dual-Mode AI (Modal & Chatbox)
│       ├── components/Toolbar.tsx    # Vertical ToolBar dọc trái
│       └── services/diagramApi.ts    # REST client
```
