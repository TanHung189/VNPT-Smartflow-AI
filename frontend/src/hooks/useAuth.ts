import { useState } from "react";
import { authApi } from "../services/authApi";

export const useAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError("");

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await authApi.login(formData);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Đăng nhập không thành công");
      }

      // Lưu vào LocalStorage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return data; // Trả về dữ liệu nếu thành công
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    setLoading(true);
    setError("");

    try {
      const response = await authApi.register({
        user_name: username,
        user_email: email,
        user_password: password,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.detail || "Đăng ký không thành công");

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return { login, register, logout, loading, error };
};
