import React, { useState } from "react";
import {
  Zap,
  FileUp,
  Sparkles,
  Loader2,
  Download,
  MousePointer2,
  Info,
} from "lucide-react";
import { ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Import logic và các thành phần đã tách
import { useFlowLogic } from "../hooks/useFlowLogic";
import FlowCanvas from "../features/flow/FlowCanvas";

const DrawDiagram = () => {
  const [promptText, setPromptText] = useState("");

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

  // Hàm xử lý khi nhấn nút Generate
  const handleStartGenerate = () => {
    if (promptText.trim()) {
      generateFlow(promptText);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] font-sans pt-16">
      {/* 1. SIDEBAR NHẬP LIỆU HIỆN ĐẠI */}
      <aside className="w-85 bg-white border-r border-slate-200 flex flex-col shadow-xl z-20 transition-all duration-300">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#0054a6] rounded-lg shadow-blue-200 shadow-lg">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              AI Generator
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Nhập mô tả quy trình VNPT để AI tự động hóa sơ đồ luồng công việc.
          </p>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Input Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mô tả quy trình
            </label>
            <textarea
              className="h-64 p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#0054a6]/20 focus:border-[#0054a6] outline-none resize-none text-sm bg-slate-50/50 transition-all shadow-inner"
              placeholder="Ví dụ: Khách hàng đăng ký 5G -> Hệ thống kiểm tra -> Kỹ thuật lắp đặt..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
          </div>

          {/* Nút Tạo Sơ Đồ */}
          <button
            onClick={handleStartGenerate}
            disabled={loading || !promptText.trim()}
            className={`group flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 ${
              loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-[#0054a6] hover:bg-[#004080] hover:shadow-blue-200"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                <span>Khởi tạo quy trình AI</span>
                <Zap className="w-4 h-4 fill-current group-hover:animate-pulse" />
              </>
            )}
          </button>

          {/* Upload Section */}
          <div className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30 group hover:border-[#0054a6] transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <FileUp className="w-4 h-4 text-[#0054a6]" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                Tải tệp nghiệp vụ
              </span>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFileAndGenerate(file);
              }}
              className="block w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-[#0054a6] hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 text-[9px] text-slate-400 border-t text-center font-medium">
          Dữ liệu được xử lý bởi VNPT AI Engine v2.0
        </div>
      </aside>

      {/* 2. KHÔNG GIAN CANVAS VẼ SƠ ĐỒ HIỆN ĐẠI */}
      <main className="flex-1 flex flex-col relative bg-white">
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
        <div className="flex-1">
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          />
        </div>

        {/* Hướng dẫn nhanh (Glassmorphism) */}
        <div className="absolute bottom-8 left-8 bg-white/70 backdrop-blur-lg p-5 rounded-[24px] border border-white/50 shadow-2xl z-10 pointer-events-none max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-[#0054a6]" />
            <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">
              Tips & Guide
            </h4>
          </div>
          <ul className="text-[11px] text-slate-600 space-y-2 font-medium">
            <li className="flex gap-2">
              <span>•</span> Nhập văn bản quy trình để AI tự động vẽ
            </li>
            <li className="flex gap-2">
              <span>•</span> Kéo thả Nodes để sắp xếp theo ý muốn
            </li>
            <li className="flex gap-2">
              <span>•</span> Hệ thống tự động tối ưu đường nối (Edges)
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default DrawDiagram;
