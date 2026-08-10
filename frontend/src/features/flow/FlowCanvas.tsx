import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  getViewportForBounds,
  Panel,
} from "@xyflow/react";
import {
  Save,
  Trash2,
  Settings,
  LayoutTemplate,
  Droplet,
  Monitor,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { BottomToolbar } from "../../components/layout/BottomToolbar";
import SmartNode from "../../components/SmartNode";
import DrawingCanvas from "../../components/DrawingCanvas";
import FlowSkeleton from "../../components/FlowSkeleton";
import {
  exportToJpg,
  exportToPng,
  exportToPdf,
} from "../../utils/exportDiagram";
import NetworkNode from "./nodes/NetworkNode";
import IofficeNode from "./nodes/IofficeNode";
import CloudNode from "./nodes/CloudNode";
import IotNode from "./nodes/IotNode";
import UmlNode from "./nodes/UmlNode";
import StickyNode from "./nodes/StickyNode";
import { NODE_REGISTRY } from "./nodes/NodeRegistry";
import { useTheme } from "next-themes";
import { useMindmapLayout } from "../../hooks/useMindmapLayout";
import { toast } from "sonner";

const MindMapIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-slate-600 dark:text-slate-300"
  >
    <rect x="10" y="10" width="4" height="4" rx="1" />
    <path d="M14 12h5" />
    <path d="M5 12h5" />
    <rect x="19" y="10" width="4" height="4" rx="1" />
    <rect x="1" y="10" width="4" height="4" rx="1" />
  </svg>
);

const LogicChartIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-slate-600 dark:text-slate-300"
  >
    <rect x="2" y="10" width="6" height="4" rx="1" />
    <path d="M8 12h4v-5h4" />
    <path d="M8 12h4v5h4" />
    <rect x="16" y="5" width="6" height="4" rx="1" />
    <rect x="16" y="15" width="6" height="4" rx="1" />
  </svg>
);

const OrgChartIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-slate-600 dark:text-slate-300"
  >
    <rect x="10" y="2" width="4" height="6" rx="1" />
    <path d="M12 8v4" />
    <path d="M6 12h12" />
    <path d="M6 12v4" />
    <path d="M18 12v4" />
    <rect x="4" y="16" width="4" height="4" rx="1" />
    <rect x="16" y="16" width="4" height="4" rx="1" />
  </svg>
);

const PRESET_COLORS = [
  "#ffffff",
  "#fafafa",
  "#f5f5f5",
  "#e5e5e5",
  "#d4d4d4",
  "#a3a3a3",
  "#525252",
  "#000000",
  "#fee2e2",
  "#ffedd5",
  "#fef3c7",
  "#dcfce7",
  "#ccfbf1",
  "#e0f2fe",
  "#e0e7ff",
  "#f3e8ff",
  "#fca5a5",
  "#fdba74",
  "#fcd34d",
  "#86efac",
  "#5eead4",
  "#7dd3fc",
  "#93c5fd",
  "#d8b4fe",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#3b82f6",
  "#a855f7",
  "#7f1d1d",
  "#7c2d12",
  "#713f12",
  "#14532d",
  "#134e4a",
  "#0c4a6e",
  "#1e3a8a",
  "#581c87",
];

// ─── NODE TYPE REGISTRY ──────────────────────────────────────────────────────
// Đăng ký tất cả custom node types — thêm type mới vào đây để ReactFlow nhận diện
// NODE_REGISTRY chứa các Context-Aware nodes mới (OrgNode, LayerNode, UMLNode, ProcessNode)
// được spread đầu tiên, các legacy nodes bên dưới sẽ ghi đè nếu trùng key.
const nodeTypes = {
  // ── Legacy / generic (SmartNode fallback) ──
  customNode: SmartNode,
  
  // ── Enterprise node types (cũ) ──
  networkNode: NetworkNode, // Hạ tầng mạng VNPT
  iofficeNode: IofficeNode, // Quy trình iOffice (legacy key)
  cloudNode: CloudNode, // Kiến trúc VNPT Cloud (glassmorphism)
  iotNode: IotNode, // Smart City / IoT
  stickyNode: StickyNode, // Sticky notes

  // ── ĐỒNG BỘ: Kéo thả từ toolbar & AI fallback sang Process Node (node trắng) ──
  taskNode: NODE_REGISTRY.processNode,
  conditionNode: NODE_REGISTRY.processNode,
  start: NODE_REGISTRY.processNode,
  end: NODE_REGISTRY.processNode,
  step: NODE_REGISTRY.processNode,
  decision: NODE_REGISTRY.processNode,

  // ── Context-Aware Template Nodes (NodeRegistry.tsx) ──
  // Để ở cuối để đảm bảo các định nghĩa mới trong Registry ghi đè các legacy keys (như infographic, umlNode...)
  ...NODE_REGISTRY,
};

const FlowContent = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  undo,
  redo,
  drawMode,
  setDrawMode,
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
  // preview props
  previewNodes,
  previewEdges,
  confirmAddToCanvas,
  cancelPreview,
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
  isGenerating,
  onOpenAI,
  aiMode,
  onDragStart,
  // Props cho Smart Structure Change
  originalText,
  generateFlow,
  provider,
}: any) => {
  const { theme, setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [structure, setStructure] = useState<
    "org-chart" | "process" | "mindmap"
  >("org-chart");
  const [bgStyle, setBgStyle] = useState<"dots" | "cross" | "lines">("dots");
  const [currentBgColor, setCurrentBgColor] = useState<string>("");
  const { screenToFlowPosition, getNodes, fitView } = useReactFlow();

  // Hook layout cho mindmap dạng ngang — chỉ active khi đang ở mode mindmap
  useMindmapLayout(
    structure === "mindmap" ? nodes : [],
    structure === "mindmap" ? edges : []
  );

  const handleStructureChange = async (
    newStructure: "org-chart" | "process" | "mindmap",
  ) => {
    const prevStructure = structure;
    setStructure(newStructure);

    // ─────────────────────────────────────────────────────────
    // Kịch bản A: Local Layout Optimization
    // Điều kiện: Trong cùng domain mindmap hoặc không có originalText
    // ─────────────────────────────────────────────────────────
    const isSameDomain = prevStructure === newStructure;
    const hasOriginalText = originalText && originalText.trim().length > 0;
    const hasNodes = nodes && nodes.length > 0;

    if (!hasNodes || !hasOriginalText || isSameDomain) {
      // Chỉ tính toán lại ELK, không gọi API
      if (autoLayout) autoLayout(newStructure);
      return;
    }

    // ─────────────────────────────────────────────────────────
    // Kịch bản B: Remote AI Transformation
    // Điều kiện: Đổi domain hoàn toàn (ví dụ: mindmap → org-chart)
    // ─────────────────────────────────────────────────────────
    const backupNodes = nodes;
    const backupEdges = edges;

    try {
      // Hiển thị loading
      const result = await generateFlow(
        originalText,
        provider || "gemini",
        undefined, // Không truyền current nodes — AI tạo lại hoàn toàn
        undefined,
        newStructure, // Truyền domain mới để AI dùng Schema tương ứng
      );

      if (!result.success) {
        // Fallback về cấu trúc cũ nếu lỗi
        setStructure(prevStructure);
        setNodes(backupNodes);
        setEdges(backupEdges);
        toast.error(`Đổi cấu trúc thất bại: ${result.errorMsg || 'Vui lòng thử lại.'}`);
      } else {
        toast.success(`Đã chuyển sang sơ đồ ${newStructure} thành công!`);
      }
    } catch (err) {
      // Fallback khi exception
      setStructure(prevStructure);
      setNodes(backupNodes);
      setEdges(backupEdges);
      toast.error('Lỗi kết nối: Không thể chuyển đổi cấu trúc sơ đồ.');
    }
  };

  // Smooth fitView transition after generation completes
  // Chỉ trigger khi isGenerating chuyển từ true → false (vừa xong generate)
  const wasGenerating = useRef(false);
  useEffect(() => {
    if (wasGenerating.current && !isGenerating && nodes.length > 0) {
      setTimeout(() => {
        fitView({ duration: 1000, padding: 0.2 });
      }, 100);
    }
    wasGenerating.current = isGenerating;
  }, [isGenerating, fitView]);

  // Export handlers
  const getExportConfig = () => {
    const renderNodes = getNodes();
    if (renderNodes.length === 0) return {};

    // 1. Lấy khung bao chuẩn xác của tất cả các node (Sát rạt các mép)
    const nodesBounds = getNodesBounds(renderNodes);

    // 2. Định nghĩa khoảng lề (padding) an toàn.
    // Giảm xuống 40px hoặc 50px để thấy nó cắt sát 4 cạnh như thế nào.
    const padding = 50;

    // 3. Ép kích thước BỨC ẢNH ĐẦU RA đúng bằng kích thước SƠ ĐỒ + LỀ (Không dư 1 pixel)
    const imageWidth = nodesBounds.width + padding * 2;
    const imageHeight = nodesBounds.height + padding * 2;

    // 4. Tính toán tọa độ dịch chuyển:
    // Dời góc trên cùng bên trái của sơ đồ về đúng vị trí lề của bức ảnh
    const transformX = -nodesBounds.x + padding;
    const transformY = -nodesBounds.y + padding;

    return {
      width: imageWidth,
      height: imageHeight,
      pixelRatio: 1, // Đảm bảo nét căng
      backgroundColor: "#ffffff", // Tránh lỗi nền đen khi lưu ảnh PNG trong suốt
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        // Ép tọa độ trực tiếp, KHÔNG dùng getViewportForBounds nữa, giữ nguyên Scale = 1
        transform: `translate(${transformX}px, ${transformY}px) scale(1)`,
      },
    };
  };

  const handleExportJpg = () => {
    // Chỉ định selector lấy toàn bộ viewport hiển thị của ReactFlow nhưng ignore UI controls qua filter trong hàm helper
    const el = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (el) exportToJpg(el, `smartflow-${Date.now()}.jpg`, getExportConfig());
  };

  const handleExportPng = () => {
    const el = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (el) exportToPng(el, `smartflow-${Date.now()}.png`, getExportConfig());
  };

  const handleExportPdf = () => {
    const el = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (el) exportToPdf(el, `smartflow-${Date.now()}.pdf`, getExportConfig());
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (
        ev.target instanceof HTMLInputElement ||
        ev.target instanceof HTMLTextAreaElement
      )
        return;
      if (ev.key === "Delete" || ev.key === "Backspace") {
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelected]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuVisible(true);
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowMiniMap(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onAnyClick = () => {
      if (menuVisible) setMenuVisible(false);
    };
    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setMenuVisible(false);
    };
    window.addEventListener("click", onAnyClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("click", onAnyClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, [menuVisible]);

  return (
    <div
      ref={containerRef}
      onContextMenu={onContextMenu}
      className="absolute inset-0 overflow-hidden"
    >
      {isGenerating && <FlowSkeleton />}



      {/*<div className="absolute left-6 top-6 z-40">
        <button
          onClick={() => autoLayout && autoLayout()}
          className="bg-indigo-600 text-white px-3 py-2 rounded-md shadow-md hover:bg-indigo-700"
          title="Sắp xếp tự động"
        >
          Sắp xếp tự động
        </button>
      </div>*/}

      <ReactFlow
        colorMode={(theme as "light" | "dark" | "system") || "system"}
        style={{ width: "100%", height: "100%" }}
        panOnDrag={!(drawMode?.type === "pen" || drawMode?.type === "eraser")}
        nodes={nodes.concat(
          (previewNodes || []).map((n: any) => ({
            ...n,
            style: { ...(n.style || {}), opacity: 0.6, borderStyle: "dashed" },
          })),
        )}
        edges={edges.concat(
          (previewEdges || []).map((e: any) => ({
            ...e,
            animated: false,
            style: {
              ...(e.style || {}),
              stroke: "#94a3b8",
              strokeDasharray: "4 4",
            },
          })),
        )}
        nodeTypes={nodeTypes}
        onNodesChange={(changes) => {
          onNodesChange(changes);
          if (
            changes[0]?.type === "position" &&
            !changes[0].dragging &&
            takeSnapshot
          )
            takeSnapshot();
        }}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onNodeClick={(_, node) => setSelectedNode(node)}
        onPaneClick={() => {
          setSelectedNode(null);
          setSelectedElements([]);
        }}
        onSelectionChange={onSelectionChange}
        fitView
      >
        <Background
          variant={
            bgStyle === "cross"
              ? BackgroundVariant.Cross
              : bgStyle === "lines"
                ? BackgroundVariant.Lines
                : BackgroundVariant.Dots
          }
          gap={bgStyle === "lines" ? 40 : 20}
          color={currentBgColor || (theme === "dark" ? "#475569" : "#cbd5e1")}
          lineWidth={bgStyle === "lines" ? 1 : undefined}
          size={bgStyle === "lines" ? undefined : 2}
        />

        {/* ─── EXACT UI DESIGN DRAGGABLE OR FLOATING PANEL ─── */}
        <Panel
          position="top-right"
          className="!top-14 !right-2 z-[100] w-[280px]"
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-800 dark:text-slate-200">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-[10px]">▼</span>
                <span className="font-semibold text-[13px]">Structure</span>
              </div>
            </div>

            <div className="p-3 space-y-4 top-14 right-2">
              {/* Structure Dropdown */}
              <div className="flex items-center justify-between">
                <span className="text-[12px]">Chart</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 justify-between border border-slate-200 dark:border-slate-600 rounded-md px-2.5 py-1 w-[130px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 outline-none transition-colors">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700 dark:text-slate-200">
                        {structure === "mindmap" ? (
                          <MindMapIcon />
                        ) : structure === "process" ? (
                          <LogicChartIcon />
                        ) : (
                          <OrgChartIcon />
                        )}
                        <span>
                          {structure === "mindmap"
                            ? "Mind Map"
                            : structure === "process"
                              ? "Logic Chart"
                              : "Org Chart"}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[160px] p-1 rounded-lg"
                  >
                    <DropdownMenuItem
                      onClick={() => handleStructureChange("mindmap")}
                      className="gap-2.5 cursor-pointer py-2 px-3 text-[13px] hover:bg-yellow-50 dark:hover:bg-slate-800"
                    >
                      <div
                        className={`p-1 rounded-full ${structure === "mindmap" ? "bg-yellow-100 dark:bg-yellow-900/50" : ""}`}
                      >
                        <MindMapIcon />
                      </div>{" "}
                      <span>Mind Map</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStructureChange("process")}
                      className="gap-2.5 cursor-pointer py-2 px-3 text-[13px] hover:bg-yellow-50 dark:hover:bg-slate-800"
                    >
                      <div
                        className={`p-1 rounded-full ${structure === "process" ? "bg-yellow-100 dark:bg-yellow-900/50" : ""}`}
                      >
                        <LogicChartIcon />
                      </div>{" "}
                      <span>Logic Chart</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStructureChange("org-chart")}
                      className="gap-2.5 cursor-pointer py-2 px-3 text-[13px] hover:bg-yellow-50 dark:hover:bg-slate-800"
                    >
                      <div
                        className={`p-1 rounded-full ${structure === "org-chart" ? "bg-yellow-100 dark:bg-yellow-900/50" : ""}`}
                      >
                        <OrgChartIcon />
                      </div>{" "}
                      <span>Org Chart</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Background Color Picker */}
              <div className="flex items-center justify-between">
                <span className="text-[12px]">Background</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-[130px] h-6 rounded-md border border-slate-300 dark:border-slate-600 shadow-sm transition-transform hover:scale-[1.02]"
                      style={{
                        backgroundColor:
                          currentBgColor ||
                          (theme === "dark" ? "#475569" : "#cbd5e1"),
                      }}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={8}
                    className="w-[280px] p-3 shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl"
                  >
                    <div className="grid grid-cols-8 gap-y-1.5 gap-x-1.5 mb-3">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setCurrentBgColor(color)}
                          className={`w-full aspect-square rounded-[4px] border hover:scale-110 transition-transform ${currentBgColor === color ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md" : "border-black/5 dark:border-white/10"}`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 flex-1">
                        <div
                          className="w-4 h-4 rounded-[3px] border border-black/10 dark:border-white/10 mx-1 flex-shrink-0"
                          style={{
                            backgroundColor:
                              currentBgColor ||
                              (theme === "dark" ? "#475569" : "#cbd5e1"),
                          }}
                        />
                        <input
                          value={
                            currentBgColor?.replace("#", "").toUpperCase() ||
                            (theme === "dark" ? "475569" : "CBD5E1")
                          }
                          onChange={(e) =>
                            setCurrentBgColor(`#${e.target.value}`)
                          }
                          className="bg-transparent border-none outline-none text-[13px] w-full text-slate-700 dark:text-slate-300 font-medium"
                          maxLength={6}
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 w-[60px]">
                        <input
                          value="100"
                          readOnly
                          className="bg-transparent border-none outline-none text-[13px] w-full text-center text-slate-700 dark:text-slate-300 font-medium"
                        />
                        <span className="text-[13px] text-slate-400 mr-1">
                          %
                        </span>
                      </div>
                      <button
                        onClick={() => setCurrentBgColor("")}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-[12px] text-slate-600 dark:text-slate-400 mb-2 font-medium">
                      Current Theme
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentBgColor("")}
                        className="w-7 h-7 rounded-[4px] border border-slate-200 dark:border-slate-600 shadow-sm hover:scale-110 transition-transform bg-white dark:bg-[#1e293b]"
                        title="Default Theme Color"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </Panel>

        <Controls
          orientation="horizontal"
          position="bottom-right"
          className="bg-slate-800 border-slate-700 fill-white shadow-2xl"
          style={{
            right: "24px",
            bottom: "24px",
            transition: "right 0.3s ease-in-out",
          }}
        />
        {showMiniMap && (
          <MiniMap
            position="bottom-left"
            className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-md mb-8 ml-6"
            maskColor="rgba(241, 245, 249, 0.7)"
            nodeBorderRadius={4}
            zoomable
            pannable
            nodeColor={(node) => {
              // ── Context-Aware Nodes (NodeRegistry) ──
              if (node.type === "org-chart" || node.type === "org")
                return "#003087";
              if (node.type === "layer" || node.type === "layered")
                return "#8b5cf6";
              if (node.type === "uml" || node.type === "uml-class")
                return "#0ea5e9";
              if (node.type === "process" || node.type === "ioffice")
                return "#10b981";
              // ── Legacy nodes ──
              if (node.type === "networkNode") return "#0066cc";
              if (node.type === "iofficeNode") return "#10b981";
              if (node.type === "cloudNode") return "#6366f1";
              if (node.type === "iotNode") return "#f59e0b";
              if (node.type === "conditionNode") return "#f59e0b";
              if (node.type === "taskNode") return "#3b82f6";
              return "#cbd5e1";
            }}
          />
        )}
        {/* Drawing overlay for pen mode: place inside ReactFlow so it inherits pan/zoom transforms */}
        <div className="absolute inset-0 z-40 pointer-events-none">
          <DrawingCanvas
            active={drawMode?.type === "pen" || drawMode?.type === "eraser"}
            color={drawMode.color}
            size={drawMode.size}
            mode={drawMode.type}
            strokes={strokes}
            onAddStroke={addStroke}
            onEraseAt={eraseAt}
            screenToFlowPosition={screenToFlowPosition}
          />
        </div>
      </ReactFlow>

      {/* Context menu (fixed to viewport) */}
      {menuVisible && menuPos && (
        <div
          className="z-50 bg-white rounded shadow-lg border py-2"
          style={{ position: "fixed", left: menuPos.x, top: menuPos.y }}
        >
          <button
            className="block px-4 py-2 w-full text-left hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation();
              const pos = screenToFlowPosition({ x: menuPos.x, y: menuPos.y });
              setNodes((nds: any) =>
                nds.concat({
                  id: `manual_${Date.now()}`,
                  type: "taskNode",
                  position: pos,
                  data: {
                    label: "Bước mới",
                    type: "task",
                    executor: "",
                    description: "",
                  },
                }),
              );
              setMenuVisible(false);
              if (takeSnapshot) setTimeout(takeSnapshot, 50);
            }}
          >
            Thêm bước mới
          </button>
          <button
            className="block px-4 py-2 w-full text-left hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation();
              const pos = screenToFlowPosition({ x: menuPos.x, y: menuPos.y });
              setNodes((nds: any) =>
                nds.concat({
                  id: `manual_${Date.now()}`,
                  type: "conditionNode",
                  position: pos,
                  data: {
                    label: "Điều kiện mới",
                    type: "decision",
                    executor: "",
                    description: "",
                  },
                }),
              );
              setMenuVisible(false);
              if (takeSnapshot) setTimeout(takeSnapshot, 50);
            }}
          >
            Thêm điều kiện
          </button>
          <button
            className="block px-4 py-2 w-full text-left text-red-600 hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation();
              if (clearAll) clearAll();
              setMenuVisible(false);
            }}
          >
            Xóa tất cả
          </button>
        </div>
      )}

      {/* keyboard delete support is attached via useEffect */}

      {/* Preview controls */}
      {previewNodes && previewNodes.length > 0 && (
        <div className="absolute left-6 top-20 z-50 flex items-center gap-2">
          <button
            onClick={() => confirmAddToCanvas && confirmAddToCanvas()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full shadow-md"
          >
            Thêm vào canvas
          </button>
          <button
            onClick={() => cancelPreview && cancelPreview()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-md"
          >
            Bỏ qua preview
          </button>
        </div>
      )}

      {/* 4. THANH CÔNG CỤ BOTTOM BAR (MOVED TO PANEL) */}
      <Panel position="bottom-center" className="z-50 mb-6">
        <BottomToolbar
          activeMode={drawMode?.type || "select"}
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
      </Panel>

      {/* 5. SIDEBAR CHI TIẾ */}
      {selectedNode && (
        <div className="absolute right-6 top-20 bottom-6 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-[30px] shadow-2xl p-6 z-[120] flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 italic">
              VNPT SmartFlow Editor
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Nhãn bước
              </label>
              <input
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-500"
                value={selectedNode.data.label}
                onChange={(e) => updateNodeData("label", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ">
                Người thực hiện
              </label>
              <input
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-500"
                value={selectedNode.data.executor}
                onChange={(e) => updateNodeData("executor", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ">
                Mô tả quy trình
              </label>
              <textarea
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 h-32 resize-none outline-none focus:border-indigo-500"
                value={selectedNode.data.description}
                onChange={(e) => updateNodeData("description", e.target.value)}
              />
            </div>
          </div>
          <button
            className="mt-4 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            onClick={() => setSelectedNode(null)}
          >
            <Save size={18} /> Lưu thay đổi
          </button>
        </div>
      )}
    </div>
  );
};

// 6. COMPONENT EXPORT
// Bỏ ReactFlowProvider ở đây vì DrawDiagram.tsx đã bọc ReactFlowProvider rồi.
// Nếu bọc 2 lần, state getNodes() ở DrawDiagram sẽ bị tách rời với state bên trong FlowCanvas, gây lỗi "Sơ đồ rỗng".
export default FlowContent;
