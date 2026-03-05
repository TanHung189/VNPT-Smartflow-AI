import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useFlowLogic } from "./hooks/useFlowLogic";
import Sidebar from "./features/chat/Sidebar";
import FlowCanvas from "./features/flow/FlowCanvas";
import { MousePointer2 } from "lucide-react";

function SmartFlowEditor() {
  const { nodes, edges, onNodesChange, onEdgesChange, loading, generateFlow } =
    useFlowLogic();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar onGenerate={generateFlow} loading={loading} />

      <main className="flex-1 flex flex-col relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-[#0054a6] rounded-md flex items-center justify-center">
              <MousePointer2 className="text-white w-5 h-5" />
            </div>
            <span className="font-extrabold text-slate-800 text-lg tracking-tight">
              VNPT <span className="text-[#0054a6]">SmartFlow</span> AI
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100">
              HỆ THỐNG ĐANG SẴN SÀNG
            </div>
          </div>
        </header>

        <div className="flex-1 relative">
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          />

          {/* Hướng dẫn nhanh nổi trên Canvas */}
          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl z-10 pointer-events-none">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">
              Hướng dẫn
            </h4>
            <ul className="text-[11px] text-slate-600 space-y-1">
              <li>• Nhập quy trình bên trái để AI vẽ sơ đồ</li>
              <li>• Dùng chuột kéo thả để sắp xếp lại các khối</li>
              <li>• Cuộn chuột để Phóng to / Thu nhỏ sơ đồ</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <SmartFlowEditor />
    </ReactFlowProvider>
  );
}
