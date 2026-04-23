import api from "./api";

export interface UserProfile {
  id_nguoi_dung: string;
  ten_nguoi_dung: string;
  email: string;
  ten_phong_ban?: string;
  anh_dai_dien?: string;
  id_vai_tro?: number;
  ngay_tao?: string;
  lan_dang_nhap_cuoi?: string;
  trang_thai_hoat_dong?: boolean;
}

export interface UserProfileUpdate {
  ten_nguoi_dung?: string;
  ten_phong_ban?: string;
}

export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get("/users/me");
    return response.data;
  },

  updateProfile: async (data: UserProfileUpdate): Promise<UserProfile> => {
    const response = await api.put("/users/me", data);
    return response.data;
  },
};
