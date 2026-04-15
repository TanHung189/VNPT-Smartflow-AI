import React, { useState } from "react";
import { getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng } from "html-to-image";

import { useFlowLogic } from "../hooks/useFlowLogic";
import FlowCanvas from "../features/flow/FlowCanvas";
import { diagramApi } from "../services/diagramApi";

import { TopHeader } from "../components/layout/TopHeader";
import { BottomToolbar } from "../components/layout/BottomToolbar";
import { AiSidebarLeft } from "../components/layout/AiSidebarLeft";
import { Sparkles } from "lucide-react";

interface StrokeData {
  id: string;
  points: number[];
  color: string;
  size: number;
}

interface SaveDiagramPayload {
  tieu_de: string;
  la_noi_bo: boolean;
  du_lieu_so_do: {
    nodes: any[];
    edges: any[];
    strokes: StrokeData[];
  };
  van_ban_dau_vao: string;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

const DrawDiagram = () => {
  const [provider, setProvider] = useState<"gemini" | "ollama">("gemini");
  const [lastSavedTime, setLastSavedTime] = useState<string>("Bản nháp");
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    isGenerating,
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
    autoLayout,
    clearAll,
    onConnect,
    onDrop,
    onSelectionChange,
    selectedNode,
    setSelectedNode,
    selectedElements,
    setSelectedElements,
    deleteSelected,
    addNoteAtCenter,
    updateNodeData,
  } = useFlowLogic();

  const handleGenerate = (text: string, provider: "gemini" | "ollama") => {
    generateFlow(text, provider);
  };

  const prepareDiagramData = (): SaveDiagramPayload => {
    return {
      tieu_de: "Quy trình VNPT mới",
      la_noi_bo: provider === "ollama",
      du_lieu_so_do: {
        nodes,
        edges,
        strokes: strokes as StrokeData[],
      },
      van_ban_dau_vao: "AI generated",
    };
  };

  const handleSave = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("Bạn cần đăng nhập để có thể lưu sơ đồ!");
      return;
    }
    try {
      const diagramData = prepareDiagramData();
      const result = await diagramApi.save(diagramData as any, token);
      if (result.id_so_do) {
        setLastSavedTime(
          `Đã lưu lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`,
        );
      } else {
        alert(`Lưu không thành công: ${result.message || "Lỗi không xác định"}`);
      }
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
      alert("Không thể kết nối tới backend, hãy kiểm tra lại server.");
    }
  };

  const handleExportPNG = async () => {
    if (nodes.length === 0) {
      alert("Không có sơ đồ để xuất ảnh!");
      return;
    }
    const nodesBounds = getNodesBounds(nodes);
    const padding = 20;
    const { x, y, zoom } = getViewportForBounds(
      nodesBounds,
      nodesBounds.width,
      nodesBounds.height,
      0.5,
      2,
      padding,
    );
    const element = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (element) {
      try {
        const dataUrl = await toPng(element, {
          backgroundColor: "#ffffff",
          width: nodesBounds.width + padding * 2,
          height: nodesBounds.height + padding * 2,
          style: {
            width: `${nodesBounds.width + padding * 2}px`,
            height: `${nodesBounds.height + padding * 2}px`,
            transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          },
        });
        const link = document.createElement("a");
        link.download = `VNPT-QuyTrinh-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error("Lỗi khi xuất ảnh:", error);
        alert("Có lỗi xảy ra khi xuất ảnh.");
      }
    }
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] font-sans">
      
      {/* ─── LAYER 1: CANVAS BACKGROUND (z-0) ─── */}
      <main className="absolute inset-0 z-0 bg-[#0f172a] overflow-hidden pt-14">
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          isGenerating={false} // Loading handled implicitly inside the flow via skeletons if needed
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          drawMode={drawMode}
          setDrawMode={setDrawMode}
          setNodes={setNodes}
          setEdges={setEdges}
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
          autoLayout={autoLayout}
          clearAll={clearAll}
          onConnect={onConnect}
          onDrop={onDrop}
          onSelectionChange={onSelectionChange}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          selectedElements={selectedElements}
          setSelectedElements={setSelectedElements}
          deleteSelected={deleteSelected}
          addNoteAtCenter={addNoteAtCenter}
          updateNodeData={updateNodeData}
        />
      </main>

      {/* ─── LAYER 2: SPARKLES TRIGGER BUTTON (z-40) ─── */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-[40]">
         <button
            onClick={() => setAiSidebarOpen(true)}
            className="p-3 bg-gradient-to-tr from-[#0066cc] to-indigo-600 rounded-2xl shadow-xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all text-white flex flex-col items-center gap-1 group"
          >
            <Sparkles size={24} className="animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase">AI</span>
            
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-lg pointer-events-none">
              Mở AI Trợ Lý
              <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
            </div>
         </button>
      </div>

      {/* ─── LAYER 2: BOTTOM TOOLBAR (z-40) ─── */}
      <BottomToolbar
        activeMode={drawMode?.type}
        onModeChange={(m: any) => setDrawMode(m)}
        onAddNote={addNoteAtCenter}
        onDeleteSelected={deleteSelected}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSetPenColor={(c: string) =>
          setDrawMode((d: any) => ({ ...d, color: c, type: "pen" }))
        }
        onSetPenSize={(s: number) =>
          setDrawMode((d: any) => ({ ...d, size: s, type: "pen" }))
        }
        onDragStart={onDragStart}
      />

      {/* ─── LAYER 3: AI SIDEBAR LEFT (z-50) ─── */}
      {/* Nằm dưới TopHeader nên có padding top 14 bên trong component */}
      <div className="absolute top-14 left-0 bottom-0 z-[50] pointer-events-none">
         <div className="h-full pointer-events-auto">
           <AiSidebarLeft
             isOpen={aiSidebarOpen}
             onClose={() => setAiSidebarOpen(false)}
             onGenerate={handleGenerate}
             onUpload={uploadFileAndGenerate}
             loading={isGenerating}
             provider={provider}
             setProvider={setProvider}
           />
         </div>
      </div>

      {/* ─── LAYER 4: TOP HEADER (z-60) ─── */}
      <TopHeader
        lastSavedTime={lastSavedTime}
        isGenerating={isGenerating}
        handleSave={handleSave}
        handleExportPNG={handleExportPNG}
      />

    </div>
  );
};

export default DrawDiagram;
