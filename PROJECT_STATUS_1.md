# PROJECT_STATUS_1.md — VNPT SmartFlow AI
> **Mục đích tài liệu:** Tổng hợp và cập nhật những sự thay đổi mới nhất (UI Đại tu, CRACO Build, Dual-Mode AI) dành cho các cộng tác viên AI đọc chép và hiểu cấu trúc hiện tại của dự án.
> **Cập nhật lần cuối:** 2026-04-15 | **Phiên bản:** 1.5.0

---

## 1. 🔄 NHỮNG THAY ĐỔI KIẾN TRÚC & UI/UX CHÍNH (So với bản cũ)

### 1.1 Khắc phục Xung đột Build System (Vite vs Webpack)
Hệ thống đã chính thức **loại bỏ Vite** để chạy thuần túy trên **CRACO (Webpack)**.
- Xóa bỏ các tệp config rác và thống nhất sử dụng `craco.config.js` với module resolution cực sạch (`@/*` alias).
- Xóa biến môi trường Vite, chuyển lại về `process.env`.
- **Trạng thái:** Dự án biên dịch (Production Build) cực kỳ ổn định, `npm run build` pass 100% không warning.

### 1.2 "Miro-Style" UI Đại tu toàn diện Canvas
- Giao diện cũ có Sidebar và Toolbar ngang màn hình, hiện tại được nâng cấp chuyên nghiệp như một Enterprise App:
  1. **Top Header Cố định:** Thanh Header `h-14` trên cùng chứa Title, Nút bật Drawer Lịch Sử bên trái, và các cụm chỉ báo (Status AI Processing / Đồng bộ Đồng hồ "Vừa lưu lúc ...") + Cụm Lưu Database/Xuất PNG.
  2. **Left Vertical Toolbar:** Dời toàn bộ công cụ (Kéo thả Node, Select, Nối dây, Export, Đổi màu Pen) dọc theo cạnh trái với thiết kế border-b chia nhóm. Tích hợp nút **Sparkles AI** bọc highlight gradient thu hút chú ý của user.
  3. **Canvas Animation (Skeleton Node):** Thay vì màn Spinner nhàm chán khi đợi AI fetch API, hệ thống vẽ một cụm "Pulse Nodes" ẩn hiện (dash line) mô phỏng AI đang suy nghĩ, kèm thông báo "AI đang phác thảo quy trình".

### 1.3 Dual-Mode AI Assistant (2 Chế độ Chatbot)
Chế độ nhập Prompt AI đã được đập đi xây lại thành trải nghiệm "Dual-Mode":
- **Mode 1: Center Modal (What are we working on?)**  
  Bấm vào `Sparkles` ở Toolbar → Bật lên Modal bự căn giữa màn hình (làm mờ Canvas). Có kèm 3 Card Template để test nhanh 3 use-case của VNPT (Lắp đặt cáp quang, Hỗ trợ xử lý, Triển khai OLT).
- **Mode 2: Floating Chatbox**  
  Sau khi gửi yêu cầu ở Center Modal → Modal tự đóng và thu về Mini Widget ở góc dưới cùng bên phải.
  - Chatbox này có giao diện Glassmorphism (Kính mờ) hiện đại, tự mở rộng khung Chat.
  - Tích hợp thêm nút **MessageSquare (Lịch sử Chat)** ngay trên header chatbox để theo dõi các prompt đã gửi.

### 1.4 History Drawer (Lịch sử Bản nháp Sơ đồ)
- Loại bỏ cái Drawer Inline khó chịu, nâng cấp thành 1 Component `HistoryDrawer` sử dụng `Sheet` trôi mượt mà từ bên trái màn hình sang.
- Được kích hoạt gián tiếp qua icon Hamburger Menu nằm chễm chệ góc trái Top Header.

---

## 2. ✅ TÍNH NĂNG ĐÃ HOÀN THIỆN
*Nhìn chung, ngoài những tính năng đã chạy tốt ở bản cũ (Text-to-Flow, Image-to-Flow, CSDL PostgreSQL+Redis, Freehand Drawing)*, các đầu việc sau đã được **Done 100%**:

1. **Chuẩn hóa Giao diện Khung Sơ Đồ Enterprise (VNPT Blue Style).**
2. **Animation UX:** Chuyển cảnh `framer-motion` mượt mà (ẩn hiện chatbox, drawer, center modal).
3. **Skeleton Loading Flow:** Màn che tối có Dash-lines chạy để báo hiệu Call AI.
4. **Phân vùng Bố Cục UI (Miro Architecture):** Xử lý z-index tuyệt đối (`z-[60]` header, `z-[100]` chatbox) để không bị đè chuột.
5. **Đồng bộ React Flow Controls:** Dời nút Zoom/Minimap góc phải hợp lý.

---

## 3. ⚠️ ĐANG PHÁT TRIỂN & CÒN TỒN ĐỌNG (Lỗi Cũ Chưa Xong)

Những lỗi từ bản `1.4.0` vẫn cần được ưu tiên trong Sprint tiếp theo:
1. **Lỗi Google OAuth COOP Policy chặn Popup (Nghiêm trọng):**
   *(Lỗi: Cross-Origin-Opener-Policy would block the window.postMessage call)*. Do chưa can thiệp set Header COOP trong FastAPI. Chưa thể Google Login trơn tru.
2. **FutureWarning của google-generativeai SDK:**
   Cảnh báo về package genai cũ (`0.8.6`). Cần code refactor đổi sang SDK `google-genai` mới để tránh bị crash sau này.
3. **Các Tab Frontend API (Ví dụ Trang My Diagrams):**
   Vẫn chưa có trang "Quản lý / Danh sách sơ đồ" full-screen thực sự. Chỉ mới có cái Lịch sử nháp History Drawer trượt bên trái. API `/diagrams/list` đã chạy tốt nhưng xài hơi hẹp.

---

## 4. 📝 DANH SÁCH FILE LIÊN QUAN ĐẾN ĐỢT REVIEW MỚI NHẤT
Những vị trí file chủ chốt định hình ra dự án như hiện tại:
- `frontend/src/pages/DrawDiagram.tsx`: Root Layout đống chứa Header, ToolBar dọc, Gọi FlowCanvas.
- `frontend/src/features/chat/Sidebar.tsx`: Chứa code phức tạp nhất cho Dual-Mode (Center Modal và Chatbox Mini Cũ).
- `frontend/src/features/flow/FlowCanvas.tsx`: React Flow Renderer với state Skeleton Mới.
- `frontend/src/components/Toolbar.tsx`: Design Cột dọc trái với nút Sparkle siêu mượt.
- `frontend/craco.config.js`: Nơi điều phối Webpack alias `@/`.
