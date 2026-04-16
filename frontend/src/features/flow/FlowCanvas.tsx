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
} from "@xyflow/react";
import { Save, Trash2 } from "lucide-react";
import SmartNode from "../../components/SmartNode";
import DrawingCanvas from "../../components/DrawingCanvas";
import FlowSkeleton from "../../components/FlowSkeleton";
import InfographicNode from "./nodes/InfographicNode";
import {
  exportToJpg,
  exportToPng,
  exportToPdf,
} from "../../utils/exportDiagram";

const nodeTypes = {
  taskNode: SmartNode,
  conditionNode: SmartNode,
  customNode: SmartNode,
  infographic: InfographicNode,
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
}: any) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const { screenToFlowPosition, getNodes, fitView } = useReactFlow();

  // Smooth fitView transition after generation completes
  useEffect(() => {
    if (!isGenerating && nodes.length > 0) {
      setTimeout(() => {
        fitView({ duration: 1000, padding: 0.2 });
      }, 100);
    }
  }, [isGenerating, nodes.length, fitView]);

  // Export handlers
  const getExportConfig = () => {
    const renderNodes = getNodes();
    if (renderNodes.length === 0) return {};

    // Tùy chỉnh export toàn bộ sơ đồ (bọc lấy toàn bộ bounding box của nodes)
    const nodesBounds = getNodesBounds(renderNodes);
    const width = nodesBounds.width || 800; // padding 50px mỗi bên
    const height = nodesBounds.height || 600;

    const viewport = getViewportForBounds(
      nodesBounds,
      width,
      height,
      0.1,
      2,
      1,
    );

    return {
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
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
      className="w-full h-full relative overflow-hidden"
      style={{ width: "100%", height: "100%" }}
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
          // Chụp ảnh khi di chuyển node xong
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
        <Background variant={BackgroundVariant.Dots} gap={20} color="#334155" />

        <Controls
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
            position="bottom-right"
            className="bg-slate-900/80 border-slate-700 shadow-2xl"
            maskColor="rgba(15, 23, 42, 0.6)"
            nodeBorderRadius={10}
            zoomable
            pannable
            style={{
              right: "24px",
              bottom: "80px",
              transition: "right 0.3s ease-in-out",
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
        <div className="absolute left-6 top-6 z-50 flex items-center gap-2">
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

      {/* 4. THANH CÔNG CỤ NGỮ CẢNH (KHI CHỌN NODE) */}
      {selectedNode && (
        <div
          className="absolute z-[110] flex gap-2 bg-slate-900 text-white p-2 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200"
          style={{
            left: selectedNode.position.x + 100,
            top: Math.max(0, selectedNode.position.y - 60),
          }}
        >
          <button
            onClick={() => updateNodeData("type", "start")}
            className="w-5 h-5 rounded-full bg-emerald-500 border border-white"
            title="Chuyển thành Bắt đầu"
          />
          <button
            onClick={() => updateNodeData("type", "decision")}
            className="w-5 h-5 rounded-full bg-amber-500 border border-white"
            title="Chuyển thành Điều kiện"
          />
          <div className="w-[1px] bg-slate-700 mx-1" />
          <button
            onClick={() => {
              setNodes((nds: any) =>
                nds.filter((n: any) => n.id !== selectedNode.id),
              );
              setSelectedNode(null);
              if (takeSnapshot) takeSnapshot();
            }}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* 5. SIDEBAR CHI TIẾT (GIỮ LẠI CỦA HƯNG) */}
      {selectedNode && (
        <div className="absolute right-6 top-6 bottom-6 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-[30px] shadow-2xl p-6 z-[120] flex flex-col">
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
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:border-indigo-500"
                value={selectedNode.data.label}
                onChange={(e) => updateNodeData("label", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Người thực hiện
              </label>
              <input
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:border-indigo-500"
                value={selectedNode.data.executor}
                onChange={(e) => updateNodeData("executor", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Mô tả quy trình
              </label>
              <textarea
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm h-32 resize-none"
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

// Export FlowContent directly — ReactFlowProvider is already at App.tsx root level.
// Removing the inner Provider eliminates redundant context initialization.
export default FlowContent as React.FC<any>;
