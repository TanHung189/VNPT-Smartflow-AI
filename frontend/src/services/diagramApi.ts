import { API_URL } from "../env";
import api from "./api";

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
  mo_ta_ngan?: string;                  // Mô tả ngắn sơ đồ
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
  mo_ta_ngan?: string;                  // Mô tả ngắn sơ đồ
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
  mo_ta_ngan?: string;
  ngay_cap_nhat: string;
  anh_thu_nho?: string;
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
    token?: string | null,
  ): Promise<DiagramApiResponse> => {
    const response = await api.post("/diagrams/save", data);
    return response.data;
  },

  /**
   * Lấy danh sách tất cả sơ đồ của người dùng hiện tại.
   * GET /diagrams/list
   */
  getAll: async (token?: string | null): Promise<DiagramListItem[]> => {
    const response = await api.get("/diagrams/list");
    return response.data?.data || response.data?.items || response.data;
  },

  /**
   * Lấy chi tiết một sơ đồ theo id_so_do.
   * GET /diagrams/{id_so_do}
   */
  getById: async (idSoDo: string, token?: string | null): Promise<DiagramApiResponse> => {
    const response = await api.get(`/diagrams/${idSoDo}`);
    return response.data;
  },

  /**
   * Cập nhật tiêu đề và dữ liệu sơ đồ.
   * PUT /diagrams/{id_so_do}
   */
  update: async (
    idSoDo: string,
    data: DiagramPayload,
    token?: string | null,
  ): Promise<DiagramApiResponse> => {
    const response = await api.put(`/diagrams/${idSoDo}`, data);
    return response.data;
  },

  /**
   * Xóa mềm sơ đồ (đặt ngay_xoa = NOW() ở backend).
   * DELETE /diagrams/{id_so_do}
   */
  delete: async (idSoDo: string, token?: string | null): Promise<{ result: string; message: string }> => {
    const response = await api.delete(`/diagrams/${idSoDo}`);
    return response.data;
  },

  /**
   * Tạo sơ đồ từ văn bản bằng mô hình AI.
   * POST /api/ai/generate/text
   */
  generateFlowText: async (
    text: string,
    provider: string,
    currentNodes?: any[],
    currentEdges?: any[],
    theLoai?: string,
  ) => {
    const response = await api.post("/ai/generate/text", {
      text,
      provider,
      the_loai: theLoai || "process",
      current_nodes: currentNodes && currentNodes.length > 0 ? currentNodes : undefined,
      current_edges: currentEdges && currentEdges.length > 0 ? currentEdges : undefined,
    });
    return response.data;
  },

  /**
   * Upload và phân tích ảnh sơ đồ bằng AI.
   * POST /api/ai/upload-process
   */
  uploadProcessImage: async (formData: FormData) => {
    // Axios requires specific headers for FormData if not set automatically
    const response = await api.post("/ai/upload-process", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // ============================================================
  // TRASH BIN API (THÙNG RÁC)
  // ============================================================
  
  getTrash: async (token?: string | null): Promise<DiagramListItem[]> => {
    const response = await api.get("/diagrams/trash/list");
    return response.data?.data || response.data?.items || response.data;
  },

  restore: async (idSoDo: string, token?: string | null): Promise<{ result: string; message: string }> => {
    const response = await api.put(`/diagrams/trash/${idSoDo}/restore`);
    return response.data;
  },

  hardDelete: async (idSoDo: string, token?: string | null): Promise<{ result: string; message: string }> => {
    const response = await api.delete(`/diagrams/trash/${idSoDo}`);
    return response.data;
  },

  emptyTrash: async (token?: string | null): Promise<{ result: string; message: string }> => {
    const response = await api.delete("/diagrams/trash/empty");
    return response.data;
  },
};
