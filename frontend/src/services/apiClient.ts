import axios from "axios";
import { toast } from "sonner";
import { API_URL } from "../env";

// ============================================================
// API CLIENT — Axios Instance cho toàn bộ ứng dụng
// ============================================================

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Timeout 30 giây cho các request AI
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Tự động đính kèm Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý lỗi toàn cục (Logout khi 401, Toast khi 500)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server trả về mã lỗi (4xx, 5xx)
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.message || "Đã xảy ra lỗi hệ thống.";
      
      if (status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else if (status === 403) {
        toast.error("Bạn không có quyền thực hiện hành động này.");
      } else if (status >= 500) {
        toast.error("Lỗi máy chủ: " + message);
      }
    } else if (error.request) {
      // Không nhận được phản hồi
      toast.error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.");
    } else {
      // Lỗi trong quá trình thiết lập request
      toast.error("Lỗi yêu cầu: " + error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
