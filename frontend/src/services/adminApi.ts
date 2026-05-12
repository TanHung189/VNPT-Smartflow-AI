import api from "./api";

export interface DashboardStats {
  totalUsers: number;
  totalDiagrams: number;
  totalTokens: number;
}

export interface AdminDiagramDTO {
  id_so_do: string;
  tieu_de: string;
  the_loai: string;
  ngay_tao: string;
  la_mau_chuan: boolean;
  anh_thu_nho?: string;
}

export interface AiModelDTO {
  id_mo_hinh?: number;
  nha_cung_cap: string;
  ten_mo_hinh: string;
  mo_ta?: string;
  trang_thai_hoat_dong: boolean;
  endpoint_url?: string;
  tham_so_cau_hinh?: string | Record<string, any>;
  ngay_tao?: string;
}

export interface ChartDataPointDTO {
  date: string;
  total: number;
}

export interface AdminStatsDTO {
  total_users: number;
  total_diagrams: number;
  total_tokens: number;
  chart_data: ChartDataPointDTO[];
  ai_usage_stats: any[];
}

export interface UserAdminDTO {
  id_nguoi_dung: string;
  ten_nguoi_dung: string;
  email: string;
  ten_phong_ban?: string;
  ma_nhan_vien?: string;
  trang_thai_hoat_dong: boolean;
  ngay_tao: string;
  id_vai_tro?: number;
}

export interface UserAdminUpdateDTO {
  id_vai_tro?: number;
  trang_thai_hoat_dong?: boolean;
}

export interface ActivityLogDTO {
  id: string;
  name: string;
  creator: string;
  time: string;
  status: 'success' | 'error' | 'pending';
}

export const AdminApi = {
  getStats: async (): Promise<AdminStatsDTO> => {
    const res = await api.get("/admin/stats");
    return res.data?.data || res.data;
  },

  getUsers: async (params?: { search?: string; id_vai_tro?: number; skip?: number; limit?: number }): Promise<{ total: number, items: UserAdminDTO[] }> => {
    const res = await api.get("/admin/users", { params });
    return res.data;
  },

  updateUser: async (userId: string, payload: UserAdminUpdateDTO): Promise<{ message: string }> => {
    const res = await api.put(`/admin/users/${userId}`, payload);
    return res.data;
  },

  getDiagrams: async (params?: { search?: string; skip?: number; limit?: number }): Promise<{ total: number, items: AdminDiagramDTO[] }> => {
    const res = await api.get("/admin/diagrams", { params });
    return res.data;
  },

  updateDiagram: async (diagramId: string, payload: Partial<AdminDiagramDTO> & { du_lieu_so_do?: any }): Promise<{ message: string }> => {
    const res = await api.put(`/admin/diagrams/${diagramId}`, payload);
    return res.data;
  },

  getAiModels: async (): Promise<AiModelDTO[]> => {
    const res = await api.get("/admin/ai-models");
    return res.data?.data || res.data?.items || res.data;
  },

  createAiModel: async (model: AiModelDTO): Promise<AiModelDTO> => {
    const res = await api.post("/admin/ai-models", model);
    return res.data;
  },

  updateAiModel: async (id: number, model: AiModelDTO): Promise<AiModelDTO> => {
    const res = await api.put(`/admin/ai-models/${id}`, model);
    return res.data;
  },

  deleteAiModel: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/admin/ai-models/${id}`);
    return res.data;
  },

  getLogs: async (): Promise<ActivityLogDTO[]> => {
    const res = await api.get("/admin/logs");
    return res.data?.data || res.data;
  },
};
