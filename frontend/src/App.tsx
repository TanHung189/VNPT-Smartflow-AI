import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import DrawDiagram from "./pages/DrawDiagram";
// import Dashboard from "./pages/Dashboard"; // Mở ra khi em đã tạo file này

export default function App() {
  return (
    // ReactFlowProvider bao ngoài cùng để mọi trang đều có thể dùng logic Flow nếu cần
    <ReactFlowProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Trang chủ: Giới thiệu dự án VNPT SmartFlow */}
          <Route path="/" element={<Home />} />

          {/* Trang Editor: Nơi AI vẽ sơ đồ quy trình */}
          <Route path="/DrawDiagram" element={<DrawDiagram />} />

          {/* Trang Dashboard: (Sẽ thêm sau) Quản lý các sơ đồ đã lưu */}
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}

          {/* Route dự phòng: Nếu gõ sai địa chỉ sẽ quay về Home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </ReactFlowProvider>
  );
}
