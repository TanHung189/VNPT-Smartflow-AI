import React from "react";
import { useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "@xyflow/react";
import { Settings } from "lucide-react";
import SmartNode from "../../components/SmartNode";

interface FlowCanvasProps {
  nodes: any[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
}

const nodeTypes = {
  customNode: SmartNode,
};

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}) => {
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);

  const onNodeClick = (_: any, node: any) => {
    setSelectedNodeData(node.data);
  };

  return (
    <div className="w-full h-full bg-[#0f172a] transition-colors duration-500">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick} // PHẢI CÓ DÒNG NÀY để hết lỗi "assigned but never used"
        onPaneClick={() => setSelectedNodeData(null)}
        fitView
        // Tăng khoảng cách an toàn khi kéo thả
        snapToGrid={true}
        snapGrid={[20, 20]}
        // QUAN TRỌNG: Cấu hình đường nối chuyên nghiệp
        defaultEdgeOptions={{
          animated: true,
          type: "smoothstep", // Giữ smoothstep nhưng tinh chỉnh chi tiết bên dưới
          style: {
            stroke: "#6366f1", // Dùng màu Indigo cho hiện đại
            strokeWidth: 3,
          },
          // Thêm mũi tên lớn và sắc nét hơn
          markerEnd: {
            type: "arrowclosed",
            color: "#6366f1",
            width: 20,
            height: 20,
          },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={30}
          size={1.5}
          color="#334155" // Màu của các đốm lưới (Slate-700)
        />
        <Controls className="bg-slate-800 border-slate-700 fill-white shadow-2xl" />
        <MiniMap
          className="bg-slate-900/80 border-slate-700 shadow-2xl"
          maskColor="rgba(15, 23, 42, 0.6)"
          nodeBorderRadius={10}
          zoomable
          pannable
        />
      </ReactFlow>

      {selectedNodeData && (
        <div className="absolute right-6 top-6 bottom-6 w-80 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[32px] shadow-2xl p-8 z-[100] animate-in slide-in-from-right duration-300">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <Settings className="text-indigo-600" size={24} />
              </div>
              <button
                onClick={() => setSelectedNodeData(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              <section>
                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                  Tên bước
                </h4>
                <h2 className="text-xl font-black text-slate-800 leading-tight">
                  {selectedNodeData.label}
                </h2>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Thông tin vận hành
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <DetailItem
                    label="Người thực hiện"
                    val={selectedNodeData.executor}
                  />
                  <DetailItem
                    label="Thời gian"
                    val={selectedNodeData.duration}
                  />
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Mô tả quy trình
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {selectedNodeData.description ||
                    "Không có mô tả chi tiết cho bước này."}
                </p>
              </section>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <span className="text-[10px] text-slate-300 font-bold italic">
                © 2026 VNPT IT Mekong
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, val }: any) => (
  <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
    <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
    <p className="text-xs font-black text-slate-700">{val || "N/A"}</p>
  </div>
);

export default FlowCanvas;
