import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "@xyflow/react/dist/style.css";

import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DrawDiagram from "./pages/DrawDiagram";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ProtectedRoute from "./components/ProtectedRouter";
import { GOOGLE_CLIENT_ID } from "./env";

console.log("App Client ID:", GOOGLE_CLIENT_ID);
export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "missing-client-id"}>
      <ReactFlowProvider>
        <Router>
          <Routes>
            {/* 1. Nhóm Route CÔNG KHAI: Không có Navbar/Footer (thường là Login/Register) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* 2. Nhóm Route CÓ NAVBAR/FOOTER: Dùng Layout chung */}
            <Route
              path="/*"
              element={
                <>
                  <Navbar />
                  <Routes>
                    {/* Trang chủ ai cũng vào được */}
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    {/* CÁC TRANG CẦN BẢO VỆ (Chỉ vào được khi đã Login) */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/DrawDiagram" element={<DrawDiagram />} />
                    </Route>

                    {/* Route dự phòng */}
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                  <Footer />
                </>
              }
            />
          </Routes>
        </Router>
      </ReactFlowProvider>
    </GoogleOAuthProvider>
  );
}
