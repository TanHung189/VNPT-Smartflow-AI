import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import "@xyflow/react/dist/style.css";

import Home from "./pages/Home";
import DrawDiagram from "./pages/DrawDiagram";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ProtectedRoute from "./components/ProtectedRouter";
import DashBoard from "./pages/DashBoard";
import { GOOGLE_CLIENT_ID } from "./env";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Recent from "./pages/Recent";
import Trash from "./pages/Trash";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "missing-client-id"}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <ReactFlowProvider>
            <Router>
              <Routes>
                {/* 1. Nhóm Guest Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* 2. Nhóm Protected Routes (Yêu cầu đăng nhập) */}
                <Route element={<ProtectedRoute />}>
                  {/* Trang Dashboard chung cho người dùng (Miro Grid clone) */}
                  <Route path="/dashboard" element={<DashBoard />} />
                  <Route path="/recent" element={<Recent />} />
                  <Route path="/trash" element={<Trash />} />

                  {/* Vẽ sơ đồ - Full màn hình, không Navbar ngoài */}
                  <Route path="/DrawDiagram" element={<DrawDiagram />} />

                  {/* Trang Admin: Tách biệt */}
                  <Route path="/admin/*" element={<AdminDashboard />} />
                </Route>

                {/* Route dự phòng - Quay về Home nếu gõ sai đường dẫn */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </ReactFlowProvider>
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
