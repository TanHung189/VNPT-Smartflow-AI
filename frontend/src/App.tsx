import React, { useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Tách logic chính ra để có thể sử dụng Provider nếu cần mở rộng sau này
function SmartFlowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      // Gọi API đến Backend FastAPI
      const response = await fetch(
        `http://127.0.0.1:8000/api/generate-flow?text=${encodeURIComponent(inputText)}`,
      );
      const resData = await response.json();

      if (resData.result === "SUCCESS") {
        // Cập nhật sơ đồ dựa trên phản hồi từ Gemini AI [cite: 45, 73, 74]
        setNodes(resData.data.nodes);
        setEdges(resData.data.edges);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể kết nối với Server. Hãy kiểm tra lại Backend!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Panel điều khiển phong cách VNPT [cite: 30, 62] */}
      <div
        style={{
          padding: "20px",
          background: "#f0f2f5",
          zIndex: 10,
          borderBottom: "1px solid #ddd",
        }}
      >
        <h3 style={{ color: "#0054a6", marginTop: 0 }}>
          SmartFlow AI - VNPT Đồng Tháp
        </h3>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Dán quy trình nghiệp vụ VNPT vào đây..."
          style={{
            width: "100%",
            height: "80px",
            marginBottom: "10px",
            padding: "10px",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            background: "#0054a6",
            color: "white",
            padding: "10px 25px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Đang phân tích quy trình..." : "Khởi tạo sơ đồ tương tác"}
        </button>
      </div>

      {/* Không gian Canvas tương tác kéo thả  */}
      <div style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background color="#ccc" gap={24} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

// Bọc ứng dụng trong Provider để đảm bảo tính ổn định cho các hook của React Flow [cite: 81]
export default function App() {
  return (
    <ReactFlowProvider>
      <SmartFlowEditor />
    </ReactFlowProvider>
  );
}
