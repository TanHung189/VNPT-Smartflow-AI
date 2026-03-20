import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute: React.FC = () => {
  // Kiểm tra xem đã có token lưu trong máy chưa
  const token = localStorage.getItem("token");

  // Nếu không có token, chuyển hướng về trang login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có token, cho phép đi tiếp vào các trang bên trong (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
