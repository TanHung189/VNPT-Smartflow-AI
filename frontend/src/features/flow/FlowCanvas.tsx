import React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "@xyflow/react";
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
  return (
    <div className="w-full h-full bg-[#0f172a] transition-colors duration-500">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
    </div>
  );
};

export default FlowCanvas;
