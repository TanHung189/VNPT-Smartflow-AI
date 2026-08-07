<div align="center">

# 🚀 VNPT SmartFlow AI

**Hệ thống thiết kế sơ đồ quy trình nghiệp vụ thông minh bằng AI**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.133-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://docs.docker.com/compose/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

*Cho phép người dùng mô tả quy trình bằng văn bản tiếng Việt hoặc hình ảnh, AI tự động chuyển đổi thành sơ đồ tương tác (interactive flowchart) trong vài giây.*

</div>

---

## ✨ Tính năng nổi bật

| Tính năng | Mô tả |
|-----------|-------|
| 🧠 **Text-to-Flow** | Nhập văn bản tiếng Việt → AI (Gemini / Ollama) tự động vẽ sơ đồ |
| 📸 **Image-to-Flow** | Upload ảnh sơ đồ → Vision AI nhận diện và tái tạo cấu trúc |
| 📄 **File Upload** | Hỗ trợ TXT, DOCX, PDF → Trích xuất nội dung → Sinh sơ đồ |
| 🎨 **7 loại sơ đồ** | Flowchart, Org-Chart, Mindmap, UML, iOffice, Layered, Network |
| ✏️ **Canvas đầy đủ** | Drag & Drop, Freehand Drawing, Undo/Redo (50 bước), Export PNG |
| 💾 **CRUD + Auto-Save** | Lưu, cập nhật, xóa mềm, thùng rác, tự động lưu sau 3 giây |
| ⚡ **Redis Cache** | 2 lớp cache: AI results (24h) + Diagram list (5 phút) |
| 🔐 **Auth** | JWT + Google OAuth 2.0, mã hóa bcrypt |
| 🛡️ **Bảo mật nội bộ** | Quy trình nhạy cảm tự động dùng AI nội bộ Ollama (không gửi Cloud) |
| 🤖 **AI Fallback** | Gemini → Ollama tự động khi Cloud lỗi; Multi-key rotation khi rate limit |
| 👑 **Admin Dashboard** | Thống kê users, diagrams, AI usage, activity log |

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────── BROWSER (React 19 + TypeScript) ──────────────────────┐
│  Dashboard ─► My Diagrams / Recent / Trash                                │
│  DrawDiagram ─► React Flow Canvas + AI Sidebar + Toolbar                  │
│  Admin Panel ─► Stats + User Management + AI Model Config                 │
└──────────────────────────┬────────────────────────────────────────────────┘
                           │ HTTP/REST (JWT Bearer)
┌──────────────────────────▼────────────────────────────────────────────────┐
│                    BACKEND (FastAPI + Uvicorn :8000)                       │
│  /api/auth/*       ─► Login, Register, Google OAuth 2.0                   │
│  /api/ai/*         ─► Text/File/Image → AI → React Flow JSON              │
│  /api/diagrams/*   ─► CRUD + Soft Delete + Trash Bin                      │
│  /api/admin/*      ─► Dashboard Stats + User/AI Model Management          │
└──────┬───────────────────────────────────────┬────────────────────────────┘
       │                                       │
┌──────▼──────┐                    ┌──────────▼──────────────────────────┐
│ PostgreSQL  │                    │  AI Engine (Provider Routing)        │
│ (Primary DB)│                    │  Cloud: Google Gemini API            │
│  - users    │                    │  Local: Ollama (qwen2.5-coder)       │
│  - diagrams │                    │  Auto-detect + Fallback logic        │
│  - versions │                    └─────────────────────────────────────┘
│  - ai_logs  │
└──────┬──────┘               ┌───────────────────────────┐
       │                      │      Redis Cache            │
       └──────────────────────│  AI results: TTL 24h        │
                              │  Diagram list/detail: 5min  │
                              └───────────────────────────┘
```

---

## 🚀 Hướng dẫn Deploy (VPS / Cloud Server)

### Yêu cầu
- VPS với Ubuntu 22.04 LTS (tối thiểu 2 CPU, 2GB RAM)
- Docker Engine ≥ 24.0 + Docker Compose ≥ 2.20
- Port `3000` (Frontend) và `8000` (Backend API) mở trên firewall

### Bước 1: Cài đặt Docker trên VPS

```bash
# SSH vào VPS
ssh root@YOUR_VPS_IP

# Cài Docker Engine
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# Cài Docker Compose plugin
apt-get install -y docker-compose-plugin
docker compose version  # Kiểm tra thành công
```

### Bước 2: Clone và cấu hình

```bash
# Clone repo
git clone https://github.com/TanHung189/VNPT-Smartflow-AI.git
cd VNPT-Smartflow-AI

# Tạo file .env từ template
cp .env.example .env
nano .env  # Hoặc: vim .env
```

### Bước 3: Điền thông tin trong `.env`

```env
# ── Thay thế các giá trị này ──────────────────────────────────

# Password mạnh cho PostgreSQL
POSTGRES_PASSWORD=MyStr0ngP@ssword

# Secret key ngẫu nhiên (chạy: python3 -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=paste-random-secret-here

# Gemini API Keys (lấy tại https://aistudio.google.com/apikey)
GEMINI_API_KEYS=AIzaSy...key1,AIzaSy...key2

# Google OAuth (lấy tại https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret

# ⚠️ QUAN TRỌNG: Thay YOUR_VPS_IP bằng IP thực của server
REACT_APP_API_BASE_URL=http://YOUR_VPS_IP:8000/api
```

### Bước 4: Cấu hình Google OAuth Console

Truy cập [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → chọn OAuth 2.0 Client → thêm:
- **Authorized JavaScript origins:** `http://YOUR_VPS_IP:3000`
- **Authorized redirect URIs:** `http://YOUR_VPS_IP:3000`

### Bước 5: Deploy 1-Click

```bash
# Build và khởi động toàn bộ stack
docker compose up -d --build

# Theo dõi logs
docker compose logs -f

# Kiểm tra tất cả containers đang healthy
docker compose ps
```

### Bước 6: Xác nhận hoạt động

```bash
# Kiểm tra API backend
curl http://YOUR_VPS_IP:8000/api/docs  # FastAPI Swagger UI

# Truy cập ứng dụng
open http://YOUR_VPS_IP:3000
```

---

## 💻 Chạy Local (Development)

```bash
# 1. Clone repo
git clone https://github.com/TanHung189/VNPT-Smartflow-AI.git
cd VNPT-Smartflow-AI

# 2. Copy và chỉnh sửa .env
cp .env.example .env
# Điền GEMINI_API_KEYS, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

# 3. Với local, REACT_APP_API_BASE_URL giữ mặc định (localhost)
# Không cần sửa gì thêm

# 4. Chạy toàn bộ stack
docker compose up -d --build

# 5. Truy cập
#   Frontend: http://localhost:3000
#   Backend API Docs: http://localhost:8000/api/docs
```

### Chạy riêng lẻ (không Docker)

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (terminal mới)
cd frontend
npm install --legacy-peer-deps
npm run dev  # hoặc: npm start
```

**Yêu cầu:** Redis server chạy tại `localhost:6379` | PostgreSQL chạy tại URL trong `backend/.env`

---

## 🧪 Kiểm thử API

```bash
# Chạy integration test (backend phải đang chạy)
cd backend
.venv\Scripts\python.exe test_diagram_api.py

# Truy cập Swagger UI để test thủ công
open http://localhost:8000/api/docs
```

---

## 📁 Cấu trúc dự án

```
VNPT-Smartflow-AI/
├── backend/                        # FastAPI Python Application
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py         # Login, Register, Google OAuth
│   │   │   │   ├── flow.py         # AI Text/File/Image → Flow JSON
│   │   │   │   ├── diagram_router.py # CRUD + Trash Bin + Redis Cache
│   │   │   │   └── admin.py        # Admin Dashboard APIs
│   │   │   ├── dependency.py       # JWT Guard (get_current_user)
│   │   │   └── router.py           # Main API router
│   │   ├── services/
│   │   │   ├── ai_service.py       # Gemini/Ollama + Cache + Fallback
│   │   │   └── diagram_service.py  # CRUD Logic + Redis Invalidation
│   │   ├── models/                 # SQLModel ORM Models
│   │   ├── schemas/                # Pydantic Request/Response Schemas
│   │   ├── database/               # AsyncEngine + Auto-seeding
│   │   └── core/                   # Config, Security, Redis Client
│   ├── migrations/                 # Alembic DB migrations
│   ├── Dockerfile
│   ├── start.sh                    # Entrypoint: wait-for-db → migrate → serve
│   └── requirements.txt
│
├── frontend/                       # React 19 + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── Auth/               # Login + Register
│   │   │   ├── DashBoard.tsx       # My Diagrams (Grid/List + Rename/Delete)
│   │   │   ├── DrawDiagram.tsx     # Canvas chính + Auto-save
│   │   │   ├── Recent.tsx          # Sơ đồ gần đây
│   │   │   ├── Trash.tsx           # Thùng rác + Restore
│   │   │   └── admin/              # Admin Dashboard
│   │   ├── hooks/
│   │   │   ├── useFlowLogic.ts     # Core: Dagre layout + Undo/Redo
│   │   │   └── useExportImage.ts   # Export PNG/JPEG
│   │   ├── features/flow/          # React Flow Canvas + Edge Types
│   │   ├── components/
│   │   │   ├── layout/             # TopHeader, Sidebar, DashboardLayout
│   │   │   └── ui/                 # shadcn/ui components
│   │   └── services/               # API clients (axios)
│   ├── nginx.conf                  # SPA routing + COOP headers
│   └── Dockerfile                  # Multi-stage: node build → nginx serve
│
├── docker-compose.yml              # Orchestration: 4 services + healthchecks
├── .env.example                    # Template cấu hình (không chứa secrets)
└── .gitignore
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | FastAPI + Uvicorn | 0.133 / 0.41 |
| **AI Engine** | Google Gemini (`google-genai`) | Latest |
| **Local AI** | Ollama (Qwen2.5-Coder) | Any |
| **Frontend** | React + TypeScript | 19 |
| **Graph** | React Flow + Dagre | Latest |
| **UI** | Tailwind CSS + shadcn/ui | v3 |
| **Database** | PostgreSQL + SQLAlchemy Async | 15 / 2.0 |
| **Cache** | Redis | 7 |
| **Auth** | JWT (python-jose) + Google OAuth | - |
| **Containerization** | Docker + Docker Compose | - |
| **Web Server** | Nginx (SPA serving) | Alpine |
| **Migrations** | Alembic | - |

---

## 👨‍💻 Tác giả

**Bùi Đổ Tấn Hưng** — Thực tập sinh kỹ thuật tại VNPT

> Dự án được phát triển trong khuôn khổ chương trình thực tập kỹ thuật VNPT, thể hiện năng lực thiết kế và triển khai hệ thống full-stack AI thực tế, từ kiến trúc phân tầng (FastAPI + React + PostgreSQL + Redis) đến containerization hoàn chỉnh với Docker Compose.
