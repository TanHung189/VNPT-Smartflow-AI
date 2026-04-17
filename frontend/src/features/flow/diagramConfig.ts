/**
 * diagramConfig.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Context-Aware Sample Prompts and Diagram Metadata
 * 
 * Mỗi `the_loai` có:
 *   - label: Tên hiển thị
 *   - icon: Emoji hoặc icon ký hiệu
 *   - color: Màu thương hiệu
 *   - description: Mô tả ngắn
 *   - samplePrompts: Danh sách câu hỏi mẫu Quick Action
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface SamplePrompt {
  title: string;        // Tiêu đề ngắn hiển thị
  prompt: string;       // Nội dung prompt đầy đủ gửi tới AI
}

export interface DiagramTypeConfig {
  label: string;
  icon: string;
  color: string;        // Tailwind text color class
  bgColor: string;      // Tailwind bg color class  
  borderColor: string;  // Tailwind border class
  description: string;
  aiRole: string;       // Vai trò AI hiển thị cho user
  samplePrompts: SamplePrompt[];
}

export const DIAGRAM_CONFIGS: Record<string, DiagramTypeConfig> = {
  "org-chart": {
    label: "Sơ đồ Tổ chức",
    icon: "🏢",
    color: "text-[#003087]",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Cơ cấu tổ chức, phân cấp nhân sự",
    aiRole: "Chuyên gia Nhân sự VNPT",
    samplePrompts: [
      {
        title: "Sơ đồ phòng CNTT",
        prompt:
          "Tạo sơ đồ tổ chức Phòng Công nghệ Thông tin VNPT gồm: Trưởng phòng, 2 Phó trưởng phòng, các tổ: Tổ Hạ tầng (3 người), Tổ Phần mềm (4 người), Tổ Bảo mật (2 người). Mỗi người ghi rõ chức danh và level.",
      },
      {
        title: "Ban Lãnh đạo tập đoàn",
        prompt:
          "Vẽ sơ đồ cơ cấu Ban Lãnh đạo Tập đoàn VNPT gồm: Chủ tịch HĐTV → Tổng Giám đốc → 5 Phó Tổng Giám đốc phụ trách các lĩnh vực: Kỹ thuật, Kinh doanh, Tài chính, Nhân sự, Chiến lược.",
      },
      {
        title: "Cơ cấu đơn vị trực thuộc",
        prompt:
          "Tạo sơ đồ cơ cấu tổ chức đơn vị trực thuộc VNPT với 4 phòng ban: Phòng Hành chính (KT), Phòng Kinh doanh, Phòng Kỹ thuật, Phòng Kế toán. Mỗi phòng có Trưởng phòng và 2-3 nhân viên.",
      },
      {
        title: "Ma trận nhân sự dự án",
        prompt:
          "Tạo sơ đồ phân công dự án SmartFlow AI với: Project Manager, Tech Lead, 2 Backend Dev, 2 Frontend Dev, 1 DevOps, 1 QA. Ghi rõ vai trò và cấp độ của từng người.",
      },
    ],
  },

  "layered": {
    label: "Kiến trúc Phân tầng",
    icon: "🏗️",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    description: "Layered Architecture, Kiến trúc hệ thống",
    aiRole: "Kiến trúc sư Hệ thống VNPT",
    samplePrompts: [
      {
        title: "Kiến trúc SmartFlow AI",
        prompt:
          "Thiết kế kiến trúc phân tầng cho hệ thống SmartFlow AI gồm 4 tầng: Presentation (React, TypeScript, Tailwind), Business Logic (FastAPI, Python, Pydantic), Data Layer (PostgreSQL, Redis, JSONB), Infrastructure (Docker, Nginx, Linux).",
      },
      {
        title: "Kiến trúc Microservices VNPT",
        prompt:
          "Vẽ kiến trúc phân tầng Microservices cho hệ thống VNPT với các tầng: API Gateway, Authentication Service, Core Services, Database Cluster, Message Queue (Kafka), Monitoring (Prometheus).",
      },
      {
        title: "Kiến trúc E-Government",
        prompt:
          "Thiết kế kiến trúc hệ thống Chính phủ điện tử (e-Government) phân tầng: Cổng thông tin (Portal), Tầng Dịch vụ (APIs), Tầng Nghiệp vụ (BPM), Tầng Dữ liệu (Data Lake), Hạ tầng Cloud.",
      },
      {
        title: "Platform IoT Smart City",
        prompt:
          "Kiến trúc hệ thống IoT Smart City với tầng: Thiết bị cảm biến (Sensors), Edge Computing, IoT Platform (MQTT/HTTP), Analytics Engine (AI/ML), Dashboard & Reporting.",
      },
    ],
  },

  "uml": {
    label: "Sơ đồ UML",
    icon: "📐",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    description: "Class Diagram, Use Case, Sequence Diagram",
    aiRole: "Kiến trúc sư Phần mềm UML",
    samplePrompts: [
      {
        title: "Class Diagram hệ thống SmartFlow",
        prompt:
          "Vẽ UML Class Diagram cho hệ thống SmartFlow AI gồm các class: NguoiDung (id, email, tenNguoiDung, matKhau; dangNhap(), capNhat()), SoDo (id, tieu_de, the_loai, du_lieu_so_do; luu(), xoa()), PhienBan (id, du_lieu, ngayTao). Thể hiện quan hệ 1-n giữa NguoiDung và SoDo.",
      },
      {
        title: "Use Case quản lý sơ đồ",
        prompt:
          "Tạo Use Case Diagram cho tính năng quản lý sơ đồ với Actor là: Người dùng (User), Admin. Các Use Case: Đăng nhập, Tạo sơ đồ, Chỉnh sửa, Xóa, Xuất PDF/SVG, Chia sẻ, Phân quyền (chỉ Admin).",
      },
      {
        title: "Class API RESTful Backend",
        prompt:
          "Vẽ Class Diagram cho Backend FastAPI của SmartFlow với: DiagramRouter (getAll, getById, save, update, delete), DiagramService (create, validateData), DiagramRepository (findById, findAll, save), DatabaseSession.",
      },
      {
        title: "Interface và Inheritance",
        prompt:
          "Tạo Class Diagram thể hiện design pattern Strategy cho AI Service: Interface AIProvider (generateFlow, generateFromImage), Class GeminiProvider, Class OllamaProvider. Class AIService dùng AIProvider theo Strategy Pattern.",
      },
    ],
  },

  "ioffice": {
    label: "Quy trình iOffice",
    icon: "📋",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    description: "Quy trình hành chính điện tử e-Gov",
    aiRole: "Chuyên gia Hành chính iOffice",
    samplePrompts: [
      {
        title: "Quy trình xử lý công văn đến",
        prompt:
          "Vẽ quy trình xử lý công văn đến tại VNPT theo iOffice: Tiếp nhận → Phân loại (mật/thường) → Trình lãnh đạo → Phân công xử lý → Thực hiện → Phản hồi → Lưu hồ sơ. Ghi rõ người thực hiện và thời gian xử lý.",
      },
      {
        title: "Quy trình phê duyệt dự án",
        prompt:
          "Xây dựng quy trình phê duyệt dự án IT tại VNPT: Đề xuất → Đánh giá kỹ thuật → Đánh giá tài chính → Phê duyệt TGĐ → Ký hợp đồng → Triển khai → Nghiệm thu. Thêm các điểm quyết định và nhánh từ chối.",
      },
      {
        title: "Quy trình tuyển dụng nhân sự",
        prompt:
          "Tạo quy trình tuyển dụng tại VNPT với iOffice: Đăng tuyển → Tiếp nhận hồ sơ → Sàng lọc CV → Phỏng vấn vòng 1 (HR) → Phỏng vấn vòng 2 (Chuyên môn) → Kiểm tra tài liệu → Quyết định tuyển dụng → Onboarding.",
      },
      {
        title: "Quy trình xin nghỉ phép",
        prompt:
          "Vẽ quy trình xin nghỉ phép qua iOffice: Nhân viên nộp đơn → Trưởng phòng xem xét → Nếu >3 ngày: chuyển HR phê duyệt → Xác nhận lịch nghỉ → Thông báo cho bộ phận. Có nhánh từ chối và yêu cầu điều chỉnh.",
      },
    ],
  },

  "process": {
    label: "Sơ đồ Quy trình",
    icon: "⚙️",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    description: "Flowchart, BPM, Business Process",
    aiRole: "Chuyên gia Phân tích Nghiệp vụ",
    samplePrompts: [
      {
        title: "Quy trình triển khai phần mềm",
        prompt:
          "Mô tả quy trình CI/CD triển khai phần mềm tại VNPT: Code commit → Build → Unit Test → Code Review → Deploy to Staging → Integration Test → Approval → Deploy to Production → Monitoring. Ghi rõ công cụ và người phụ trách.",
      },
      {
        title: "Quy trình hỗ trợ khách hàng",
        prompt:
          "Tạo quy trình Customer Support VNPT: Khách hàng phản ánh → Tiếp nhận ticket → Phân loại kỹ thuật/thương mại → Xử lý Level 1 → Nếu không giải quyết: Escalate Level 2 → Giải pháp → Đóng ticket → Khảo sát hài lòng.",
      },
      {
        title: "Quy trình cấp phép dịch vụ",
        prompt:
          "Vẽ quy trình cấp phép dịch vụ viễn thông mới: Doanh nghiệp đăng ký → Kiểm tra hồ sơ → Thẩm định kỹ thuật → Thẩm định pháp lý → Phê duyệt Bộ TT&TT → Cấp giấy phép → Kích hoạt dịch vụ.",
      },
      {
        title: "Luồng xử lý thanh toán",
        prompt:
          "Tạo quy trình xử lý thanh toán online tại VNPT Pay: Khởi tạo giao dịch → Xác thực OTP → Kiểm tra số dư → Kết nối cổng thanh toán → Phê duyệt ngân hàng → Cập nhật số dư → Gửi thông báo → Lưu lịch sử.",
      },
    ],
  },

  "mindmap": {
    label: "Sơ đồ Tư duy",
    icon: "🧠",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    description: "Mindmap, Hệ thống ý tưởng, Brainstorming",
    aiRole: "Chuyên gia Tư duy Sáng tạo",
    samplePrompts: [
      {
        title: "Kế hoạch ra mắt sản phẩm",
        prompt:
          "Tạo sơ đồ tư duy cho kế hoạch ra mắt sản phẩm mới của VNPT gồm: Mục tiêu, Đối tượng khách hàng, Kênh marketing (Social, Email, Event), Ngân sách, Timeline.",
      },
      {
        title: "Brainstorming tính năng App",
        prompt:
          "Vẽ mindmap ý tưởng tính năng cho ứng dụng MyVNPT: Thanh toán, Chăm sóc khách hàng, Gói cước, Giải trí, Ưu đãi. Phát triển 2-3 nhánh con cho mỗi ý.",
      },
      {
        title: "Chiến lược chuyển đổi số",
        prompt:
          "Thiết kế sơ đồ tư duy chiến lược chuyển đổi số VNPT: Hạ tầng số, Chính quyền số, Kinh tế số, Xã hội số, An toàn thông tin.",
      },
      {
        title: "Kỹ năng lập trình Modern Web",
        prompt:
          "Tạo mindmap lộ trình học web hiện đại: Frontend (HTML, CSS, JS, React), Backend (API, DB, Auth), DevOps (Docker, CI/CD), Cloud (AWS/Azure).",
      },
    ],
  },

  "infrastructure": {
    label: "Hạ tầng Mạng",
    icon: "🌐",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    description: "Network Topology, Data Center, Viễn thông",
    aiRole: "Kỹ sư Hạ tầng Mạng VNPT",
    samplePrompts: [
      {
        title: "Topology mạng nội bộ VNPT",
        prompt:
          "Thiết kế sơ đồ topology mạng nội bộ văn phòng VNPT gồm: Core Switch (Cisco Catalyst), Distribution Switch (2 chiếc), Access Switches (8 chiếc), Router Biên/Edge, Firewall (ASA 5500), DMZ Zone với Web Server và Mail Server.",
      },
      {
        title: "Kiến trúc Data Center",
        prompt:
          "Vẽ kiến trúc Data Center VNPT với: Internet Edge (BGP/OSPF), Load Balancer (F5), Application Tier (Web Servers), Business Tier (App Servers), Database Tier (PostgreSQL Cluster), Storage Area Network (SAN), VLAN segmentation.",
      },
      {
        title: "Hạ tầng VNPT Cloud",
        prompt:
          "Thiết kế hạ tầng VNPT Cloud Infrastructure với: Internet Gateway, NAT Gateway, Public Subnet (Load Balancer), Private Subnet (App Server), Database Subnet (RDS), VPN Connection, CloudWatch Monitoring.",
      },
      {
        title: "Mạng phân phối nội dung CDN",
        prompt:
          "Vẽ sơ đồ CDN (Content Delivery Network) của VNPT với: Origin Server tại Hà Nội, Edge Nodes tại HCM/Đà Nẵng/Cần Thơ, DNS Load Balancing, Cache Layer, SSL/TLS Termination, DDoS Protection.",
      },
    ],
  },
};

/**
 * Lấy config cho 1 loại sơ đồ, fallback về process
 */
export const getDiagramConfig = (theLoai: string): DiagramTypeConfig => {
  return DIAGRAM_CONFIGS[theLoai] ?? DIAGRAM_CONFIGS["process"];
};

/**
 * Danh sách tất cả loại sơ đồ (dùng cho dropdown/picker)
 */
export const DIAGRAM_TYPE_OPTIONS = Object.entries(DIAGRAM_CONFIGS).map(
  ([value, cfg]) => ({ value, label: cfg.label, icon: cfg.icon }),
);
