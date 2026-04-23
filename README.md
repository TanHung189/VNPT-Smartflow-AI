# 🚀 Hệ Thống Tạo Sơ Đồ Thông Minh

> **Dự án thực tập tốt nghiệp** — Được đóng gói hoàn toàn bằng Docker, sẵn sàng chạy chỉ với một lệnh duy nhất.

---

## 📋 Giới Thiệu

**VNPT SmartFlow AI** là nền tảng tạo và quản lý sơ đồ thông minh (flowchart, ERD, sequence diagram, v.v.) được hỗ trợ bởi trí tuệ nhân tạo (Gemini AI & Ollama). Hệ thống bao gồm:

- **Backend**: FastAPI + PostgreSQL + Redis + Alembic (migrations)
- **Frontend**: React (TypeScript) + React Flow + Vite — được serve bởi Nginx
- **AI Engine**: Tích hợp Google Gemini API và Ollama (LLM cục bộ)

Toàn bộ hệ thống **được đóng gói hoàn chỉnh bằng Docker Compose**, bao gồm cả việc tự động hoá migration cơ sở dữ liệu.

---

## ✅ Yêu Cầu Hệ Thống

| Công cụ | Phiên bản tối thiểu |
|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | ≥ 4.x |
| [Ollama](https://ollama.com/) | Bất kỳ (cần chạy trên máy host) |

---

## 🛠️ Hướng Dẫn Khởi Chạy (CHỈ 3 BƯỚC)

### Bước 1 — Khởi động Docker Desktop & Ollama

- Mở **Docker Desktop** và đảm bảo nó đang chạy.
- Khởi động **Ollama** trên máy host (để backend container có thể gọi qua `host.docker.internal`):

```bash
ollama serve
```

---

### Bước 2 — Cấu hình biến môi trường

Sao chép file mẫu và điền thông tin cần thiết (Gemini API Keys, v.v.):

```bash
cp .env.example .env
```

> **Lưu ý:** Nếu bạn đã có file `.env` với cấu hình sẵn, hãy bỏ qua bước này.

---

### Bước 3 — Khởi chạy toàn bộ hệ thống

```bash
docker-compose up --build
```

**Chỉ vậy thôi.** Hệ thống sẽ tự động:

1. 🏗️ Build image cho Backend và Frontend.
2. 🗄️ Khởi động PostgreSQL và Redis.
3. 🔄 **Tự động chạy migration cơ sở dữ liệu** (`alembic upgrade head`) — không cần thao tác thủ công.
4. 🚀 Khởi động FastAPI backend và Nginx frontend.

---

## 🗄️ Tự Động Hoá Migration (Không Cần Thao Tác Thủ Công)

> ⚠️ **Quan trọng cho người chấm điểm:**
>
> Phiên bản này đã **hoàn toàn tự động hoá quá trình migration cơ sở dữ liệu**.
> Khi container `backend` khởi động, script `start.sh` sẽ tự động chạy lệnh
> `alembic upgrade head` trước khi khởi động ứng dụng.
>
> **Người dùng KHÔNG cần phải chạy thủ công bất kỳ lệnh migration nào.**

Luồng khởi động của Backend container:

```
[Container Start]
      │
      ▼
alembic upgrade head   ← Tự động áp dụng tất cả schema migrations
      │
      ▼
uvicorn app.main:app   ← Khởi động FastAPI server
```

---

## 🌐 Truy Cập Ứng Dụng

Sau khi `docker-compose up --build` hoàn tất, truy cập các địa chỉ sau trên trình duyệt:

| Dịch vụ | URL | Mô tả |
|---|---|---|
| 🖥️ **Frontend (Giao diện)** | http://localhost:5173 | Ứng dụng React chính |
| ⚙️ **Backend API** | http://localhost:8000 | FastAPI REST API |
| 📖 **API Docs (Swagger)** | http://localhost:8000/docs | Tài liệu API tương tác |
| 📖 **API Docs (ReDoc)** | http://localhost:8000/redoc | Tài liệu API thay thế |

---

## 🏗️ Kiến Trúc Docker

```
docker-compose.yml
├── postgres        → PostgreSQL 15 (port 5432)
├── redis           → Redis 7 (port 6379)
├── backend         → FastAPI + Alembic (port 8000)
│     └── start.sh → Chạy migration → Khởi động Uvicorn
└── frontend        → React + Nginx (port 5173)
```

---

## 📁 Cấu Trúc Dự Án

```
VNPT-Smartflow-AI/
├── backend/
│   ├── app/              # Mã nguồn FastAPI
│   ├── migrations/       # Alembic migration files
│   ├── start.sh          # Script khởi động tự động (migration + server)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/              # Mã nguồn React/TypeScript
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🔑 Biến Môi Trường Quan Trọng (`.env`)

| Biến | Mô tả |
|---|---|
| `POSTGRES_USER` | Tên đăng nhập PostgreSQL |
| `POSTGRES_PASSWORD` | Mật khẩu PostgreSQL |
| `POSTGRES_DB` | Tên database |
| `SECRET_KEY` | Khoá bí mật JWT |
| `GEMINI_API_KEYS` | Google Gemini API Key(s) |

---

