import axios from "axios";
import { toast } from "sonner";
import { API_URL } from "../env";

// ============================================================
// GLOBAL API CLIENT (AXIOS INSTANCE)
// ============================================================
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 300000,
});

// REQUEST INTERCEPTOR: Tự động đính kèm Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// RESPONSE INTERCEPTOR: Xử lý lỗi toàn cục
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      // Trích xuất message từ FastAPI backend (thường là trong detail)
      const detailMessage =
        typeof data?.detail === "string"
          ? data.detail
          : data?.detail?.[0]?.msg || "Đã xảy ra lỗi trên server";

      if (status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        localStorage.removeItem("token");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else if (status === 403) {
        toast.error("Bạn không có quyền thực hiện chức năng này!");
      } else if (status === 404) {
        toast.error(detailMessage || "Không tìm thấy dữ liệu!");
      } else if (status >= 500) {
        toast.error(detailMessage || "Lỗi máy chủ (500).");
      } else {
        toast.error(detailMessage); // 400 Validation errors
      }
    } else if (error.request) {
      toast.error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!");
    } else {
      toast.error("Đã xảy ra lỗi trong quá trình gửi yêu cầu!");
    }
    return Promise.reject(error);
  },
);

export default api;
