import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import "@xyflow/react/dist/style.css";

import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DrawDiagram from "./pages/DrawDiagram";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ProtectedRoute from "./components/ProtectedRouter";
import DashBoard from "./pages/DashBoard";
import { GOOGLE_CLIENT_ID } from "./env";
import AdminDashboard from "./pages/admin/AdminDashboard";

// Component Layout cho User để tái sử dụng Navbar/Footer
const UserLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "missing-client-id"}>
      <AuthProvider>
        <ReactFlowProvider>
          <Router>
            <Routes>
              {/* 1. Nhóm KHÔNG có Navbar/Footer (Auth & Admin & Dashboard) */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes (Yêu cầu đăng nhập) */}
              <Route element={<ProtectedRoute />}>
                {/* Trang Admin: Tách biệt hoàn toàn */}
                <Route path="/admin/*" element={<AdminDashboard />} />
                
                {/* Trang Dashboard chung cho người dùng */}
                <Route path="/dashboard" element={<DashBoard />} />

                {/* Vẽ sơ đồ - Sử dụng UserLayout */}
                <Route
                  path="/DrawDiagram"
                  element={
                    <UserLayout>
                      <DrawDiagram />
                    </UserLayout>
                  }
                />
              </Route>

              {/* 2. Nhóm CÓ Navbar/Footer cho trang chủ (Guest/User) */}
              <Route
                path="/"
                element={
                  <UserLayout>
                    <Home />
                  </UserLayout>
                }
              />

              {/* Route dự phòng - Quay về Home nếu gõ sai đường dẫn */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </ReactFlowProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
