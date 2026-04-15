import React, { useState, useCallback } from "react";
import { getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

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

const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

const DrawDiagram = () => {
  const [provider, setProvider] = useState<"gemini" | "ollama">("gemini");
  const [lastSavedTime, setLastSavedTime] = useState<string>("Bản nháp");
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  // Lưu ID sơ đồ sau khi save lần đầu → dùng PATCH cho auto-save tiếp theo
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  // Tiêu đề sơ đồ — được chia sẻ giữa DrawDiagram & TopHeader
  const [diagramTitle, setDiagramTitle] = useState<string>("VNPT SmartFlow Workspace");

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

  // ─────────────────── LOAD DIAGRAM FROM HISTORY ───────────────────
  const handleLoadDiagram = useCallback((id: string, flowData?: any) => {
    if (!flowData) return;
    const loadedNodes = flowData.nodes ?? [];
    const loadedEdges = flowData.edges ?? [];
    const loadedStrokes = flowData.strokes ?? [];
    setNodes(loadedNodes);
    setEdges(loadedEdges);
    // strokes are internal to useFlowLogic — trigger via clearStrokes + addStroke not available here,
    // but we pass the id and title back to state so the next save will do a PUT
    setCurrentDiagramId(id);
    setTimeout(takeSnapshot, 100);
    toast.success("Đã tải sơ đồ lên canvas thành công!");
  }, [setNodes, setEdges, takeSnapshot]);

  const handleGenerate = (text: string, provider: "gemini" | "ollama") => {
    generateFlow(text, provider);
  };

  const buildDiagramPayload = () => ({
    tieu_de: diagramTitle,
    la_noi_bo: provider === "ollama",
    du_lieu_so_do: {
      nodes,
      edges,
      strokes: strokes as StrokeData[],
    },
    van_ban_dau_vao: "AI generated",
  });

  // ─────────────────── SAVE / UPDATE ───────────────────
  const handleSave = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Bạn cần đăng nhập để lưu sơ đồ!");
      return;
    }
    if (nodes.length === 0) {
      toast.warning("Sơ đồ đang trống, chưa có gì để lưu.");
      return;
    }

    const payload = buildDiagramPayload();

    try {
      let result: any;

      if (currentDiagramId) {
        // Đã có sơ đồ → cập nhật (PUT)
        result = await diagramApi.update(currentDiagramId, payload as any, token);
        if (result?.id_so_do) {
          const savedAt = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
          setLastSavedTime(`Đã lưu lúc ${savedAt}`);
          toast.success("Cập nhật sơ đồ thành công!");
        } else {
          toast.error(result?.message || "Cập nhật không thành công.");
        }
      } else {
        // Chưa có → tạo mới (POST)
        result = await diagramApi.save(payload as any, token);
        if (result?.id_so_do) {
          setCurrentDiagramId(result.id_so_do);
          const savedAt = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
          setLastSavedTime(`Đã lưu lúc ${savedAt}`);
          toast.success("Lưu sơ đồ thành công!");
        } else {
          toast.error(result?.message || "Lưu không thành công.");
        }
      }
    } catch (error) {
      toast.error("Không thể kết nối tới backend. Hãy kiểm tra lại server.");
    }
  }, [nodes, edges, strokes, diagramTitle, provider, currentDiagramId]);

  // ─────────────────── RENAME via PATCH ───────────────────
  const handleRename = useCallback(async (newTitle: string) => {
    setDiagramTitle(newTitle);
    if (!currentDiagramId) return; // Chưa lưu, không PATCH
    const token = getAuthToken();
    if (!token) return;
    try {
      await diagramApi.update(
        currentDiagramId,
        { tieu_de: newTitle, du_lieu_so_do: { nodes, edges, strokes }, la_noi_bo: provider === "ollama" } as any,
        token,
      );
    } catch (_) {
      // Silent — rename không block UX
    }
  }, [currentDiagramId, nodes, edges, strokes, provider]);

  // ─────────────────── EXPORT PNG ───────────────────
  const handleExportPNG = async () => {
    if (nodes.length === 0) {
      toast.warning("Không có sơ đồ để xuất ảnh!");
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
        toast.success("Xuất PNG thành công!");
      } catch (error) {
        toast.error("Có lỗi xảy ra khi xuất ảnh.");
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
          isGenerating={false}
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
        diagramTitle={diagramTitle}
        onRename={handleRename}
        onLoadDiagram={handleLoadDiagram}
      />

    </div>
  );
};

export default DrawDiagram;
