import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
} from "@xyflow/react";
import { Save, Trash2 } from "lucide-react";
import SmartNode from "../../components/SmartNode";
import Toolbar from "../../components/Toolbar";

const nodeTypes = {
  taskNode: SmartNode,
  conditionNode: SmartNode,
  customNode: SmartNode,
};

// 1. COMPONENT CHỨA LOGIC CHÍNH
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
}: any) => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  // --- LOGIC VẼ TAY (NATIVE CANVAS) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.lineCap = "round";

    // Resize canvas theo màn hình
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || drawMode.type === "select") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = drawMode.type === "eraser" ? "#ffffff" : drawMode.color;
      ctx.lineWidth = drawMode.size;
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    }
  };

  // --- LOGIC TƯƠNG TÁC NODE & EDGE ---
  const onConnect = useCallback(
    (params: any) => {
      setEdges((eds: any) =>
        addEdge({ ...params, animated: true, type: "smoothstep" }, eds),
      );
      if (takeSnapshot) takeSnapshot();
    },
    [setEdges, takeSnapshot],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow");
      if (!type) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode = {
        id: `manual_${Date.now()}`,
        type,
        position,
        data: {
          label: "Bước mới",
          executor: "Chưa gán",
          duration: "15p",
          description: "",
        },
      };
      setNodes((nds: any) => nds.concat(newNode));
      if (takeSnapshot) takeSnapshot();
    },
    [screenToFlowPosition, setNodes, takeSnapshot],
  );

  const updateNodeData = (field: string, value: string) => {
    setNodes((nds: any) =>
      nds.map((n: any) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, [field]: value } }
          : n,
      ),
    );
    setSelectedNode((prev: any) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
    }));
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      <Toolbar />
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
        onPaneClick={() => setSelectedNode(null)}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} color="#334155" />

        <Controls className="bg-slate-800 border-slate-700 fill-white shadow-2xl" />
        <MiniMap
          className="bg-slate-900/80 border-slate-700 shadow-2xl"
          maskColor="rgba(15, 23, 42, 0.6)"
          nodeBorderRadius={10}
          zoomable
          pannable
        />
      </ReactFlow>

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

// 6. COMPONENT EXPORT (BẮT BUỘC CÓ PROVIDER)
const FlowCanvas = (props: any) => {
  return (
    <ReactFlowProvider>
      <FlowContent {...props} />
    </ReactFlowProvider>
  );
};

export default FlowCanvas;
