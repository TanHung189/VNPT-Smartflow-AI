import { API_URL } from "../env";

// ============================================================
// KIỂU DỮ LIỆU — Khớp 100% với bảng `so_do` (vnpt_smartflow_v1)
// ============================================================

/**
 * Payload gửi lên khi tạo hoặc cập nhật sơ đồ.
 * Tương ứng với schema TaoSoDo / CapNhatSoDo ở backend.
 */
export interface DiagramPayload {
  tieu_de: string;                      // Tiêu đề sơ đồ (bắt buộc)
  du_lieu_so_do: {                      // Dữ liệu React Flow (nodes + edges)
    nodes: any[];
    edges: any[];
    strokes?: any[];
  };
  la_noi_bo?: boolean;                  // Chỉ dùng AI nội bộ? (mặc định false)
  van_ban_dau_vao?: string;             // Văn bản prompt gốc của người dùng
  the_loai?: string;                    // Thể loại sơ đồ (default: "flowchart")
}

/**
 * Dữ liệu trả về từ API sau khi tạo/cập nhật sơ đồ.
 * Tương ứng với schema TraLoiSoDo ở backend.
 */
export interface DiagramApiResponse {
  id_so_do: string;                     // UUID sơ đồ
  id_chu_so_huu: string;               // UUID người sở hữu
  tieu_de: string;                      // Tiêu đề
  du_lieu_so_do: Record<string, any>;   // Dữ liệu React Flow
  la_noi_bo: boolean;                   // Cờ AI nội bộ
  la_mau_chuan: boolean;               // Là template chuẩn?
  ngay_tao: string;                     // ISO datetime
  ngay_cap_nhat: string;               // ISO datetime
  message?: string;                     // Thông báo tùy chọn
}

/**
 * Phần tử trong danh sách sơ đồ (GET /diagrams/list).
 * Tương ứng với schema TraLoiDanhSachSoDo ở backend.
 */
export interface DiagramListItem {
  id_so_do: string;
  tieu_de: string;
  the_loai: string;
  la_noi_bo: boolean;
  la_mau_chuan: boolean;
  ngay_cap_nhat: string;
}

// ============================================================
// API SERVICE — Gọi backend endpoints quản lý sơ đồ
// ============================================================
export const diagramApi = {

  /**
   * Lưu sơ đồ mới vào bảng so_do.
   * POST /diagrams/save
   */
  save: async (
    data: DiagramPayload,
    token: string | null,
  ): Promise<DiagramApiResponse> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/diagrams/save`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Lấy danh sách tất cả sơ đồ của người dùng hiện tại.
   * GET /diagrams/list
   */
  getAll: async (token?: string | null): Promise<DiagramListItem[]> => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/diagrams/list`, { headers });
    return response.json();
  },

  /**
   * Lấy chi tiết một sơ đồ theo id_so_do.
   * GET /diagrams/{id_so_do}
   */
  getById: async (idSoDo: string, token?: string | null): Promise<DiagramApiResponse> => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/diagrams/${idSoDo}`, { headers });
    return response.json();
  },

  /**
   * Cập nhật tiêu đề và dữ liệu sơ đồ.
   * PUT /diagrams/{id_so_do}
   */
  update: async (
    idSoDo: string,
    data: DiagramPayload,
    token: string | null,
  ): Promise<DiagramApiResponse> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/diagrams/${idSoDo}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Xóa mềm sơ đồ (đặt ngay_xoa = NOW() ở backend).
   * DELETE /diagrams/{id_so_do}
   */
  delete: async (idSoDo: string, token: string | null): Promise<{ result: string; message: string }> => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/diagrams/${idSoDo}`, {
      method: "DELETE",
      headers,
    });
    return response.json();
  },

  /**
   * Đổi tên sơ đồ (PATCH nhẹ — chỉ cập nhật title, không gửi lại flow_data).
   * PATCH /diagrams/{id}/rename
   */
  rename: async (idSoDo: string, newTitle: string, token: string | null): Promise<{ result: string }> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}/diagrams/${idSoDo}/rename`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ tieu_de: newTitle }),
    });
    return response.json();
  },

  /**
   * Tạo sơ đồ từ văn bản bằng mô hình AI.
   * POST /api/ai/generate/text
   */
  generateFlowText: async (text: string, provider: string) => {
    return fetch(`${API_URL}/ai/generate/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, provider }),
    });
  },

  /**
   * Upload và phân tích file/ảnh sơ đồ bằng AI.
   * POST /api/ai/upload-process
   */
  uploadProcessImage: async (formData: FormData) => {
    return await fetch(`${API_URL}/ai/upload-process`, {
      method: "POST",
      body: formData,
    });
  },
};
