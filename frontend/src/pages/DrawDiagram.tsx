import React from "react";
import { Download, CloudUpload } from "lucide-react";

import { useFlowLogic } from "../hooks/useFlowLogic";
import FlowCanvas from "../features/flow/FlowCanvas";
import Sidebar from "../features/chat/Sidebar";

const DrawDiagram = () => {
  // Lấy toàn bộ logic xử lý AI từ hook đã viết
  const {
    nodes,
    edges,
    setNodes,
    setEdges, // Đảm bảo hook useFlowLogic có trả về setEdges
    onNodesChange,
    onEdgesChange,
    loading,
    generateFlow,
    uploadFileAndGenerate,
    drawMode,
    setDrawMode,
    undo,
    redo,
    takeSnapshot,
  } = useFlowLogic();

  // Hàm xử lý Lưu dữ liệu lên Database (Để Hưng làm tiếp)
  const handleSaveToDB = async () => {
    const diagramData = {
      title: "Quy trình mới", // Có thể lấy từ một input khác
      nodes: nodes,
      edges: edges,
    };
    console.log("Dữ liệu chuẩn bị lưu:", diagramData);
    // Tại đây Hưng sẽ gọi axios.post('/diagrams', diagramData)
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] font-sans pt-16">
      {/* 1. SIDEBAR NHẬP LIỆU HIỆN ĐẠI */}
      <Sidebar
        onGenerate={generateFlow}
        onUpload={uploadFileAndGenerate}
        loading={loading}
      />

      {/* 2. KHÔNG GIAN CANVAS VẼ SƠ ĐỒ HIỆN ĐẠI */}
      <main className="flex-1 flex flex-col relative bg-white overflow-hidden">
        {/* Floating Tool Bar - Khu vực các nút chức năng cao cấp */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-xl flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${loading ? "bg-amber-500 animate-spin" : "bg-green-500 animate-pulse"}`}
              />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                {loading ? "AI Processing..." : "AI Connected"}
              </span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* Nút Lưu Database - Cực kỳ quan trọng để hoàn thiện đồ án */}
            <button
              onClick={handleSaveToDB}
              className="text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
              title="Lưu vào PostgreSQL"
            >
              <CloudUpload className="w-4 h-4" />
              <span className="text-[10px] font-bold">LƯU</span>
            </button>

            <button className="text-slate-500 hover:text-[#0054a6] transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area - Tích hợp đầy đủ logic */}
        <div className="flex-1 w-full h-full min-h-0 bg-[#0f172a]">
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            drawMode={drawMode} // THIẾU DÒNG NÀY SẼ GÂY LỖI
            setDrawMode={setDrawMode} // THIẾU DÒNG NÀY SẼ GÂY LỖI
            setNodes={setNodes}
            setEdges={setEdges} // <-- Phải truyền cái này để nối dây bằng tay được
            undo={undo}
            redo={redo}
            takeSnapshot={takeSnapshot}
          />
        </div>
      </main>
    </div>
  );
};

export default DrawDiagram;
