import React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "@xyflow/react";

interface FlowCanvasProps {
  nodes: any[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}) => {
  return (
    <div className="w-full h-full bg-[#f8fafc]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "#0054a6", strokeWidth: 2 },
          type: "smoothstep", // Tạo đường nối vuông góc mượt mà chuyên nghiệp
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#cbd5e1"
        />
        <Controls
          className="bg-white border-none shadow-xl rounded-lg overflow-hidden"
          position="bottom-right"
        />
        <MiniMap
          className="rounded-xl border-slate-200 shadow-lg"
          maskColor="rgba(241, 245, 249, 0.7)"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
