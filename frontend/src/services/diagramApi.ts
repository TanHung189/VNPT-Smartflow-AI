import { API_URL } from "../env";
import apiClient from "./apiClient";

// ============================================================
// KIỂU DỮ LIỆU — Khớp 100% với bảng `so_do` (vnpt_smartflow_v1)
// ============================================================

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
  anh_thu_nho?: string;                 // Base64 thumbnail ảnh chụp
}

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

export interface DiagramListItem {
  id_so_do: string;
  tieu_de: string;
  the_loai: string;
  la_noi_bo: boolean;
  la_mau_chuan: boolean;
  ngay_cap_nhat: string;
  anh_thu_nho?: string;
}

// ============================================================
// API SERVICE — Gọi backend endpoints quản lý sơ đồ
// ============================================================
export const diagramApi = {

  save: async (
    data: DiagramPayload,
    token?: string | null, // Token handled by interceptor, parameter optional for legacy compatibility
  ): Promise<DiagramApiResponse> => {
    const response = await apiClient.post<DiagramApiResponse>("/diagrams/save", data);
    return response.data;
  },

  getAll: async (token?: string | null): Promise<DiagramListItem[]> => {
    const response = await apiClient.get<DiagramListItem[]>("/diagrams/list");
    return response.data;
  },

  getById: async (idSoDo: string, token?: string | null): Promise<DiagramApiResponse> => {
    const response = await apiClient.get<DiagramApiResponse>(`/diagrams/${idSoDo}`);
    return response.data;
  },

  update: async (
    idSoDo: string,
    data: DiagramPayload,
    token?: string | null,
  ): Promise<DiagramApiResponse> => {
    const response = await apiClient.put<DiagramApiResponse>(`/diagrams/${idSoDo}`, data);
    return response.data;
  },

  delete: async (idSoDo: string, token?: string | null): Promise<{ result: string; message: string }> => {
    const response = await apiClient.delete<{ result: string; message: string }>(`/diagrams/${idSoDo}`);
    return response.data;
  },

  rename: async (idSoDo: string, newTitle: string, token?: string | null): Promise<{ result: string }> => {
    const response = await apiClient.patch<{ result: string }>(`/diagrams/${idSoDo}/rename`, { tieu_de: newTitle });
    return response.data;
  },

  generateFlowText: async (text: string, provider: string, current_diagram_state?: string) => {
    return apiClient.post("/ai/generate/text", { text, provider, current_diagram_state });
  },

  uploadProcessImage: async (formData: FormData) => {
    // Interceptor uses application/json by default, need to override for multipart
    return apiClient.post("/ai/upload-process", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
