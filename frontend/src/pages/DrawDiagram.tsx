import React from "react";
import { Download } from "lucide-react";

import { useFlowLogic } from "../hooks/useFlowLogic";
import FlowCanvas from "../features/flow/FlowCanvas";
import Sidebar from "../features/chat/Sidebar";

const DrawDiagram = () => {
  // Lấy toàn bộ logic xử lý AI từ hook đã viết
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    loading,
    generateFlow,
    uploadFileAndGenerate,
  } = useFlowLogic();

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
        {/* Floating Tool Bar */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-xl flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">
                AI Connected
              </span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <button className="text-slate-500 hover:text-[#0054a6] transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 w-full h-full min-h-0 bg-[#0f172a]">
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          />
        </div>
      </main>
    </div>
  );
};

export default DrawDiagram;
