# TỔNG QUAN DỰ ÁN: VNPT SMARTFLOW AI

**Tên dự án:** VNPT SmartFlow AI - Hệ thống Vẽ sơ đồ thông minh tự động hóa bằng AI.
**Loại dự án:** Đồ án Thực tập / Sản phẩm doanh nghiệp nội bộ.

---

## 1. MỤC TIÊU DỰ ÁN
Xây dựng một nền tảng Web Application hiện đại cho phép người dùng thiết kế, quản lý và tự động sinh các loại sơ đồ (Lưu đồ quy trình, Sơ đồ tổ chức, Sơ đồ tư duy, UML...) bằng ngôn ngữ tự nhiên thông qua AI, thay vì phải kéo thả thủ công mất thời gian.

## 2. KIẾN TRÚC CÔNG NGHỆ (TECH STACK)
Hệ thống được thiết kế theo chuẩn **Microservices**, đóng gói hoàn toàn bằng **Docker**, đảm bảo tiêu chí "1-Click Deployment" (Khởi chạy bằng 1 dòng lệnh).

### 🖥️ Frontend (Client)
- **Framework:** ReactJS (viết bằng TypeScript để đảm bảo Type-Safety).
- **Thư viện Sơ đồ chính:** React Flow (Quản lý node/edge trên Canvas) kết hợp Dagre (Thuật toán Auto-layout tự động sắp xếp sơ đồ).
- **UI/UX:** Tailwind CSS + Radix UI / Shadcn (Thiết kế phẳng, hiện đại, hỗ trợ Dark/Light mode).
- **Deployment:** Nginx (Serves file tĩnh tĩnh và xử lý SPA routing cục bộ).

### ⚙️ Backend (Server & API)
- **Framework:** FastAPI (Python) - Hiệu năng cao, hỗ trợ Async/Await native.
- **Database ORM:** SQLModel & SQLAlchemy (Giao tiếp với database bằng code Python thay vì viết câu lệnh SQL).
- **Migration:** Alembic (Tự động tracking biến đổi của Database và tạo bảng tự động, không cần import file `.sql` thủ công).
- **Xác thực (Auth):** OAuth2 với Google + JWT Token (Mã hóa phân quyền bảo mật).

### 🧠 Trí tuệ Nhân tạo (AI Engine)
- **Cloud AI (Primary):** Google Gemini 3 Flash (Sử dụng SDK `google-genai` mới nhất) - Tốc độ phản hồi nhanh, logic chuyển đổi ngôn ngữ tự nhiên sang JSON cực tốt.
- **Local AI (Fallback):** Ollama (Qwen2.5-Coder) - Đề phòng trường hợp mất mạng hoặc Cloud API bị lỗi cạn dung lượng, hệ thống sẽ tự động switch sang AI local.

### 🗄️ Cơ sở Dữ liệu & Lưu trữ
- **Primary DB:** PostgreSQL 15 (Chứa dữ liệu người dùng, cấu trúc JSON của sơ đồ, log hoạt động).
- **Cache DB:** Redis 7 (Đóng vai trò làm bộ nhớ đệm, tối ưu tốc độ phản hồi khi render các sơ đồ đã từng được vẽ).

---

## 3. TÍNH NĂNG CỐT LÕI (CORE FEATURES)

### 3.1. Hạt nhân Sinh sơ đồ tự động (AI Render)
Đây là "trái tim" của dự án. Người dùng nhập câu lệnh tiếng Việt (vd: *"Vẽ sơ đồ quy trình xin nghỉ phép"*), hệ thống xử lý theo pipeline:
1. **Frontend:** Gửi prompt ngôn ngữ tự nhiên về Backend.
2. **Backend:** Bơm (Inject) ngữ cảnh chuyên ngành dựa trên thể loại sơ đồ (Mindmap, Flowchart...) để ép Gemini trả về định dạng chuẩn JSON.
3. **Regex Extraction:** Trích xuất đoạn mã JSON an toàn (loại bỏ các text thừa của AI).
4. **Frontend Normalization:** Frontend nhận JSON, chuyển đổi thành chuẩn Node/Edge của thư viện React Flow.
5. **Dagre Auto-Layout:** Chạy thuật toán đồ thị có hướng (Directed Graph) để tự sắp xếp sơ đồ vuông vắn tắp lự theo chiều ngang (LR) hoặc dọc (TB) mà không dính đè lên nhau.

### 3.2. Quản lý Không gian làm việc (Canvas Workspace)
- Tạo, sửa, kéo thả các khối hộp dễ dàng.
- Thanh công cụ Bottom Toolbar chuyên nghiệp giúp chỉnh sửa màu sắc, nét đứt, kiểu chữ của Nodes.
- Tính năng Export ra ảnh PNG độ nét cao giữ chuẩn CSS nội tại.

### 3.3. Tự động hóa Dữ liệu (Auto-Seeding)
- Ngay khi Container khởi chạy, hệ thống kiểm tra Database trống sẽ tự động **Seeding** (bơm) dữ liệu phân quyền (`quan_tri`, `nhan_vien`) và cấu hình AI default (Gemini, Ollama). 
- Tính năng này giúp loại bỏ gánh nặng thiết lập Database thủ công của người đánh giá đồ án.

---

## 4. CẤU TRÚC DATABASE (LƯU TRỮ)
Hệ thống gồm các Table chính:
1. **NguoiDung:** Lưu thông tin cá nhân.
2. **VaiTro:** Quản lý quyền hệ thống (RBAC - Role-based access control).
3. **MoHinhAI:** Bảng switch cấu hình AI (Chọn gọi con AI nào để sinh sơ đồ).
4. **SoDo:** Lưu trữ Workspace, title, và quan trọng nhất là mã JSON mã hóa của hệ thống tọa độ Node/Edge.
5. **SoDoLog / NhatKyAI:** Giám sát truy vết thao tác.
6......
7....
---

## 5. TỔNG KẾT & MỨC ĐỘ THỰC TIỄN
Hệ thống không chỉ dừng lại quy mô đồ án sinh viên mà đã được cấu trúc ở cấp độ **Enterprise-ready (Sẵn sàng cho doanh nghiệp)**:
- Không bị phụ thuộc môi trường local (Solve bằng Docker & Nginx).
- Xử lý lỗi (Error handling) xuất sắc: Các Try-Catch cơ chế Fallback (Gemini sập tự chuyển Ollama) được cài đặt chi tiết.
- Tính an toàn: Loại bỏ cứng `.env` trên Git, dùng JWT Bearer cho Router, mật khẩu mã hoá.


