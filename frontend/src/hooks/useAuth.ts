import { useState } from "react";
import { authApi } from "../services/authApi";

/**
 * useAuth — Hook xử lý xác thực người dùng.
 * Cung cấp các hàm login, register, logout cùng trạng thái loading/error.
 *
 * ⚠️  Tên trường payload phải khớp 100% với schema TaoNguoiDung (backend):
 *      ten_nguoi_dung, email, mat_khau
 */
export const useAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error,   setError]   = useState<string>("");

  // ─────────────────────────────────────────────
  // ĐĂNG NHẬP — Email + Mật khẩu (OAuth2 form)
  // ─────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError("");

    // FastAPI OAuth2PasswordRequestForm yêu cầu field tên là "username"
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await authApi.login(formData);
      const data     = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Email hoặc mật khẩu không chính xác");
      }

      // Lưu token và thông tin người dùng vào localStorage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user",  JSON.stringify(data.user));

      return data; // { access_token, token_type, user: DocNguoiDung }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // ĐĂNG KÝ — Tạo tài khoản mới
  // ─────────────────────────────────────────────
  const register = async (
    ten_nguoi_dung: string,   // Họ tên đầy đủ (khớp cột bảng nguoi_dung)
    email: string,
    mat_khau: string,
  ) => {
    setLoading(true);
    setError("");

    try {
      const response = await authApi.register({
        ten_nguoi_dung,   // ✅ Đúng field name backend TaoNguoiDung
        email,
        mat_khau,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Đăng ký không thành công");
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // ĐĂNG XUẤT
  // ─────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return { login, register, logout, loading, error };
};
