import React from "react";
import { Download, CloudUpload } from "lucide-react";

import { useFlowLogic } from "../hooks/useFlowLogic";
import FlowCanvas from "../features/flow/FlowCanvas";
import Sidebar from "../features/chat/Sidebar";
import { diagramApi } from "../api/diagramApi";

// --- INTERFACES: SOLID and Typescript adherence ---
interface StrokeData {
  id: string;
  points: number[];
  color: string;
  size: number;
}

interface SaveDiagramPayload {
  title: string;
  flow_data: {
    nodes: any[];
    edges: any[];
    strokes: StrokeData[];
  };
  raw_text_input: string;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

const DrawDiagram = () => {
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
    strokes,
    addStroke,
    undoStroke,
    clearStrokes,
    eraseAt,
    canUndo,
    canRedo,
  } = useFlowLogic();

  /**
   * Helper function to bundle diagram data securely.
   */
  const prepareDiagramData = (): SaveDiagramPayload => {
    return {
      title: "Quy trình mới", // Sẽ lấy từ input người dùng sau này
      flow_data: {
        nodes,
        edges,
        strokes: strokes as StrokeData[], // Lưu bao gồm cả dữ liệu strokes vẽ tay
      },
      raw_text_input: "văn bản do AI tạo",
    };
  };

  /**
   * Main function to handle save logic triggered by the Save Button.
   */
  const handleSave = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("Bạn cần đăng nhập để có thể lưu sơ đồ!");
      return;
    }

    const diagramData = prepareDiagramData();
    console.log("Dữ liệu chuẩn bị lưu:", diagramData);

    try {
      // Gọi lên Backend API kèm theo cấu trúc dữ liệu và Token
      const result = await diagramApi.save(diagramData, token);

      // result.diagram_id từ response API nếu tạo thành công
      if (result.status === "Success" || result.diagram_id) {
        alert(`Đã lưu thành công! id sơ đồ là: ${result.diagram_id}`);
      } else {
        alert(
          `Lưu không thành công: ${result.message || "Lỗi không xác định"}`,
        );
      }
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
      alert("Không thể kết nối tới backend, hãy kiểm tra uvicorn");
    }
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
              onClick={handleSave}
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
            strokes={strokes}
            addStroke={addStroke}
            undoStroke={undoStroke}
            clearStrokes={clearStrokes}
            eraseAt={eraseAt}
            canUndo={canUndo}
            canRedo={canRedo}
            takeSnapshot={takeSnapshot}
          />
        </div>
      </main>
    </div>
  );
};

export default DrawDiagram;
