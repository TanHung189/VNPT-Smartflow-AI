import React, { createContext, useContext, useState, ReactNode } from "react";

export interface User {
  id_nguoi_dung?: string;    // UUID người dùng (khớp với cột id_nguoi_dung)
  ten_nguoi_dung?: string;   // Họ tên đầy đủ (khớp với cột ten_nguoi_dung)
  email?: string;            // Địa chỉ email
  // Tên vai trò: 'quan_tri' = Admin, 'nhan_vien' = Nhân viên
  ten_vai_tro?: 'quan_tri' | 'nhan_vien';
  anh_dai_dien?: string;     // URL ảnh đại diện
  id_vai_tro?: number;       // Mã vai trò (FK → vai_tro)
  // Giữ lại các alias cũ để tránh lỗi cho code chưa cập nhật
  id?: string;
  name?: string;
  role?: 'admin' | 'user' | 'quan_tri' | 'nhan_vien';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Sync initial state with localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Ensure role exists for testing purposes if not provided by backend
        if (!parsed.role) parsed.role = 'user';
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated: !!user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
