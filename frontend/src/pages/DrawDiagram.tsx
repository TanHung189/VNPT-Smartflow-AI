import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  useReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import { toJpeg, toSvg } from "html-to-image";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

import { useFlowLogic } from "../hooks/useFlowLogic";
import { useExportImage } from "../hooks/useExportImage";
import FlowCanvas from "../features/flow/FlowCanvas";
import { diagramApi } from "../services/diagramApi";

import { TopHeader } from "../components/layout/TopHeader";
import { AiSidebarLeft } from "../components/layout/AiSidebarLeft";
import { Sparkles, X } from "lucide-react";

interface StrokeData {
  id: string;
  points: number[];
  color: string;
  size: number;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

const DrawDiagramContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const templateParam = searchParams.get("template");
  // Context-Aware: loại sơ đồ từ URL param `type` (từ dashboard) hoặc `template`
  const diagramTypeParam =
    searchParams.get("type") || templateParam || "process";

  const [provider, setProvider] = useState<string>("gemini");
  const [lastSavedTime, setLastSavedTime] = useState<string>("Bản nháp");
  const [isSaving, setIsSaving] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  // Lưu ID sơ đồ sau khi save lần đầu → dùng PATCH cho auto-save tiếp theo
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  // Tiêu đề sơ đồ — được chia sẻ giữa DrawDiagram & TopHeader
  const [diagramTitle, setDiagramTitle] = useState<string>(
    "VNPT SmartFlow Workspace",
  );
  const [lastActionReason, setLastActionReason] = useState<string>(
    "Tạo mới/Cập nhật thủ công",
  );
  // Lưu văn bản gốc người dùng nhập vào để dùng cho AI Re-render khi đổi domain
  const [originalText, setOriginalText] = useState<string>("");
  const { fitView, getNodes, getEdges } = useReactFlow();

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
    uploadImageAndGenerate,
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

  // Custom hook Export, need to pass strokes and nodes so image export has correct bounds
  const {
    downloadImage,
    copyImageToClipboard,
    isExporting: isUiExporting,
  } = useExportImage(strokes, nodes);

  // ─────────────────── LOAD DIAGRAM FROM HISTORY ───────────────────
  const handleLoadDiagram = useCallback(
    (id: string, flowData?: any) => {
      if (!flowData) return;
      const loadedNodes = (flowData.nodes ?? []).map((n: any) => ({
        ...n,
        data: {
          ...n.data,
          themeConfig: flowData.themeConfig,
        },
      }));
      const loadedEdges = flowData.edges ?? [];

      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setCurrentDiagramId(id);
      setTimeout(() => {
        takeSnapshot();
        fitView({ duration: 0, padding: 0.2 });
      }, 100);
      toast.success("Đã tải sơ đồ lên canvas thành công!");
    },
    [setNodes, setEdges, takeSnapshot, fitView],
  );

  // Bootstrapping template if exists
  useEffect(() => {
    if (templateParam && nodes.length === 0) {
      if (templateParam === "retro") {
        setNodes([
          {
            id: "intro_1",
            type: "infographic",
            position: { x: 100, y: 100 },
            data: {
              variant: "swot",
              label: "Strengths",
              description: "Điểm mạnh cần phát huy.",
            },
          },
          {
            id: "intro_2",
            type: "infographic",
            position: { x: 450, y: 100 },
            data: {
              variant: "comparison",
              label: "Weakness",
              description: "Điểm yếu cần khắc phục.",
            },
          },
        ]);
        setDiagramTitle("Retrospective / SWOT");
      } else if (templateParam === "kanban") {
        setNodes([
          {
            id: "k_1",
            type: "infographic",
            position: { x: 50, y: 100 },
            data: {
              variant: "process",
              label: "To Do",
              description: "Việc cần làm.",
            },
          },
          {
            id: "k_2",
            type: "infographic",
            position: { x: 400, y: 100 },
            data: {
              variant: "timeline",
              label: "In Progress",
              description: "Đang tiến hành.",
            },
          },
          {
            id: "k_3",
            type: "infographic",
            position: { x: 750, y: 100 },
            data: {
              variant: "mindmap",
              label: "Done",
              description: "Đã xong.",
            },
          },
        ]);
        setEdges([
          { id: "e1", source: "k_1", target: "k_2", animated: true },
          { id: "e2", source: "k_2", target: "k_3", animated: true },
        ]);
        setDiagramTitle("Kanban Framework");
      } else if (templateParam === "sequence") {
        setNodes([
          {
            id: "s_1",
            type: "infographic",
            position: { x: 100, y: 100 },
            data: {
              variant: "process",
              label: "Client Request",
              description: "HTTP Request tới backend.",
            },
          },
          {
            id: "s_2",
            type: "infographic",
            position: { x: 100, y: 350 },
            data: {
              variant: "timeline",
              label: "Backend API",
              description: "FastAPI xử lý Logic.",
            },
          },
        ]);
        setEdges([
          {
            id: "e1",
            source: "s_1",
            target: "s_2",
            label: "Gửi request",
            animated: true,
          },
        ]);
        setDiagramTitle("UML Sequence");
      } else if (templateParam === "mindmap") {
        setNodes([
          {
            id: "root",
            type: "mindmapNode",
            position: { x: 400, y: 300 },
            data: { label: "✨ Nhập prompt để AI vẽ Mindmap..." },
          },
        ]);
        setDiagramTitle("Sơ đồ Tư duy (Mindmap)");
      } else if (templateParam === "org-chart") {
        setNodes([
          {
            id: "root",
            type: "orgNode",
            position: { x: 400, y: 100 },
            data: { label: "👑 CEO / Giám đốc" },
          },
        ]);
        setDiagramTitle("Sơ đồ Tổ chức (Org-Chart)");
      } else if (templateParam === "uml") {
        setNodes([
          {
            id: "root",
            type: "umlNode",
            position: { x: 400, y: 200 },
            data: { label: "Hệ thống (Nhập prompt...)" },
          },
        ]);
        setDiagramTitle("Thiết kế Hạ tầng (UML)");
      } else if (templateParam === "ioffice") {
        setNodes([
          {
            id: "root",
            type: "processNode",
            position: { x: 100, y: 200 },
            data: {
              label: "Bước 1: Bắt đầu",
              executor: "Admin",
              status: "PENDING",
            },
          },
        ]);
        setDiagramTitle("Quy trình Nghiệp vụ (iOffice)");
      }
      setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 200);
      searchParams.delete("template");
      setSearchParams(searchParams);
    }
  }, [
    templateParam,
    nodes.length,
    setNodes,
    setEdges,
    searchParams,
    setSearchParams,
    fitView,
  ]);

  // Load old diagram if provided via ID
  const diagramIdParam = searchParams.get("id");
  useEffect(() => {
    if (diagramIdParam && nodes.length === 0) {
      const load = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
          const data = await diagramApi.getById(diagramIdParam, token);
          handleLoadDiagram(diagramIdParam, data.du_lieu_so_do);
          setDiagramTitle(data.tieu_de);
        } catch (e) {}
      };
      load();
    }
  }, [diagramIdParam, handleLoadDiagram, nodes.length]);

  const handleGenerate = useCallback(
    async (text: string, currentProvider: string): Promise<{ success: boolean; errorMsg?: string }> => {
      const modelName =
        currentProvider === "gemini"
          ? "Gemini 2.0 Flash"
          : "Ollama Qwen2.5 Coder";
      setLastActionReason(`AI Generated - ${modelName}`);

      // Lưu lại originalText để dùng cho AI transformation khi đổi domain sau
      if (text && text.trim()) {
        setOriginalText(text.trim());
      }

      // Gửi raw request và nhận về kết quả
      const result = await generateFlow(
        text,
        currentProvider,
        nodes.length > 0 ? nodes : undefined,
        edges.length > 0 ? edges : undefined,
        diagramTypeParam,
      );
      
      // Auto renderer nằm trong generateFlow sẽ update hooks
      return result;
    },
    [generateFlow, nodes, edges, diagramTypeParam],
  );

  // ─────────────────── THUMBNAIL CAPTURE ───────────────────
  const captureThumbnailBase64 = useCallback(async (): Promise<
    string | null
  > => {
    const renderNodes = getNodes();
    if (!renderNodes || renderNodes.length === 0) return null;

    const padding = 50; // Lề an toàn 50px cho đẹp

    try {
      const nodesBounds = getNodesBounds(renderNodes);

      // 1. Ép kích thước ảnh bằng đúng Khung sơ đồ + Lề
      const imageWidth = nodesBounds.width + padding * 2;
      const imageHeight = nodesBounds.height + padding * 2;

      // 2. Tự tính toán tọa độ dịch chuyển tịnh tiến (Vứt bỏ getViewportForBounds)
      const transformX = -nodesBounds.x + padding;
      const transformY = -nodesBounds.y + padding;

      const element = document.querySelector(
        ".react-flow__viewport",
      ) as HTMLElement;
      if (!element) return null;

      return await toJpeg(element, {
        backgroundColor: "#ffffff",
        pixelRatio: 0.5, // Nâng lên 0.5 để nét hơn, không bị mờ
        quality: 0.8,
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          // 3. ÉP MẠNH TỌA ĐỘ VÀ SCALE = 1
          transform: `translate(${transformX}px, ${transformY}px) scale(1)`,
        },
      });
    } catch {
      return null;
    }
  }, [getNodes]);

  const buildDiagramPayload = useCallback(
    async (includeThumbnail = true) => {
      const thumbnail = includeThumbnail
        ? await captureThumbnailBase64()
        : undefined;

      // Khởi tạo payload cơ bản
      const payload: any = {
        tieu_de: diagramTitle,
        la_noi_bo: provider === "ollama",
        du_lieu_so_do: {
          nodes: nodes,
          edges: edges,
          strokes: strokes as StrokeData[],
        },
        van_ban_dau_vao: "AI generated",
        ly_do_thay_doi: lastActionReason,
      };

      // Chỉ ghim anh_thu_nho vào nếu có capture (tránh ghi đè null lên ảnh cũ)
      if (thumbnail) {
        payload.anh_thu_nho = thumbnail;
      }

      return payload;
    },
    [diagramTitle, provider, strokes, captureThumbnailBase64, nodes, edges, lastActionReason],
  );

  // ─────────────────── SAVE / UPDATE ───────────────────
  const handleSave = useCallback(
    async (isAutoSave = false) => {
      const token = getAuthToken();
      if (!token) {
        if (!isAutoSave) toast.error("Bạn cần đăng nhập để lưu sơ đồ!");
        return;
      }
      
      const currentNodes = nodes;
      const currentEdges = edges;
      
      if (!currentNodes || currentNodes.length === 0) {
        if (!isAutoSave) toast.warning("Sơ đồ đang trống, chưa có gì để lưu.");
        return;
      }

      if (!currentEdges) {
        if (!isAutoSave) toast.error("Lỗi cấu trúc dữ liệu! Vui lòng thử lại.");
        return;
      }

      // Bắt đầu quá trình lưu
      if (!isAutoSave) setIsSaving(true);
      const payload = await buildDiagramPayload(!isAutoSave);

      try {
        let result: any;

        if (currentDiagramId) {
          // Đã có sơ đồ → cập nhật (PUT)
          result = await diagramApi.update(
            currentDiagramId,
            payload as any,
            token,
          );
          if (result?.id_so_do) {
            const savedAt = new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            });
            setLastSavedTime(`Đã lưu lúc ${savedAt}`);
            if (!isAutoSave) toast.success("Cập nhật sơ đồ thành công!");
          } else {
            if (!isAutoSave)
              toast.error(result?.message || "Cập nhật không thành công.");
          }
        } else {
          // Chưa có → tạo mới (POST)
          result = await diagramApi.save(payload as any, token);
          if (result?.id_so_do) {
            setCurrentDiagramId(result.id_so_do);
            const savedAt = new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            });
            setLastSavedTime(`Đã lưu lúc ${savedAt}`);
            if (!isAutoSave) toast.success("Lưu sơ đồ thành công!");
          } else {
            if (!isAutoSave)
              toast.error(result?.message || "Lưu không thành công.");
          }
        }

        // Reset lý do lại thành thủ công sau khi lưu thành công phiên bản AI
        if (!isAutoSave) {
          setLastActionReason("Cập nhật thủ công");
        }
      } catch (error) {
        if (!isAutoSave)
          toast.error(
            "Không thể kết nối tới backend. Hãy kiểm tra lại server.",
          );
      } finally {
        if (!isAutoSave) setIsSaving(false);
      }
    },
    [
      currentDiagramId,
      buildDiagramPayload,
      nodes,
      edges,
    ],
  );

  // ─────────────────── AUTO-SAVE EFFECT ───────────────────
  useEffect(() => {
    if (nodes.length === 0) return; // Chỉ auto-save khi đã có dữ liệu
    const timeoutId = setTimeout(() => {
      handleSave(true);
    }, 5000); // 5s để tránh race condition khi AI đang render nodes liên tục
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, currentDiagramId, handleSave]);

  // ─────────────────── GLOBAL HOTKEYS ───────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";

      // Ctrl+S — Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave(false);
      }
      // Ctrl+Z — Undo
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y / Ctrl+Shift+Z — Redo
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" ||
          (e.shiftKey && e.key.toLowerCase() === "z"))
      ) {
        e.preventDefault();
        redo();
      }
      // Del / Backspace — Delete selected elements
      if ((e.key === "Delete" || e.key === "Backspace") && !inInput) {
        deleteSelected();
      }
      // Ctrl+A — Select all nodes
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a" && !inInput) {
        e.preventDefault();
        setSelectedElements(nodes);
        if (nodes.length > 0)
          toast.info(`Đã chọn tất cả ${nodes.length} node.`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, undo, redo, deleteSelected, nodes, setSelectedElements]);

  // ─────────────────── RENAME via PATCH ───────────────────
  const handleRename = useCallback(
    async (newTitle: string) => {
      setDiagramTitle(newTitle);
      if (!currentDiagramId) return; // Chưa lưu, không PATCH
      const token = getAuthToken();
      if (!token) return;
      try {
        await diagramApi.update(
          currentDiagramId,
          {
            tieu_de: newTitle,
            du_lieu_so_do: { nodes, edges, strokes },
            la_noi_bo: provider === "ollama",
          } as any,
          token,
        );
      } catch (_) {
        // Silent
      }
    },
    [currentDiagramId, nodes, edges, strokes, provider],
  );

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
          onDragStart={onDragStart}
          originalText={originalText}
          generateFlow={generateFlow}
          provider={provider}
        />
      </main>

      {/* ─── LAYER 2: SPARKLES TRIGGER BUTTON (z-[60]) ─── */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 z-[60] transition-all duration-300 ease-in-out ${
          aiSidebarOpen ? "left-[330px] lg:left-[360px]" : "left-4"
        }`}
      >
        <button
          onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
          className={`p-3 bg-gradient-to-tr from-[#0066cc] to-indigo-600 rounded-full shadow-xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all text-white flex flex-col items-center justify-center gap-1 group overflow-hidden ${
            aiSidebarOpen ? "w-12 h-12" : "w-14 h-14"
          }`}
        >
          {aiSidebarOpen ? (
            <X
              size={24}
              className="transition-transform duration-300 rotate-90 group-hover:rotate-0"
            />
          ) : (
            <>
              <Sparkles size={22} className="animate-pulse" />
              <span className="text-[9px] font-bold tracking-widest uppercase">
                AI
              </span>
            </>
          )}

          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-lg pointer-events-none">
            {aiSidebarOpen ? "Đóng bảng AI" : "Mở AI Trợ Lý"}
            <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
          </div>
        </button>
      </div>

      {/* ─── LAYER 3: AI SIDEBAR LEFT (z-50) ─── */}
      <div className="absolute top-14 left-0 bottom-0 z-[50] pointer-events-none">
        <div className="h-full pointer-events-auto">
          <AiSidebarLeft
            isOpen={aiSidebarOpen}
            onClose={() => setAiSidebarOpen(false)}
            onGenerate={handleGenerate}
            onUpload={uploadFileAndGenerate}
            onUploadImage={uploadImageAndGenerate}
            loading={isGenerating}
            provider={provider}
            setProvider={setProvider}
            diagramType={diagramTypeParam}
          />
        </div>
      </div>

      {/* ─── LAYER 4: TOP HEADER (z-60) ─── */}
      <TopHeader
        lastSavedTime={isSaving ? "Đang lưu..." : lastSavedTime}
        isGenerating={isGenerating}
        isExporting={isUiExporting}
        handleSave={() => handleSave(false)}
        handleDownloadPNG={downloadImage}
        handleCopyPNG={copyImageToClipboard}
        diagramTitle={diagramTitle}
        diagramType={diagramTypeParam}
        onRename={handleRename}
        onLoadDiagram={handleLoadDiagram}
      />
    </div>
  );
};

const DrawDiagram = () => (
  <ReactFlowProvider>
    <DrawDiagramContent />
  </ReactFlowProvider>
);

export default DrawDiagram;
