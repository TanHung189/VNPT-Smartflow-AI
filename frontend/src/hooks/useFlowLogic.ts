import { useState, useCallback } from "react";
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB",
) => {
  // Cấu hình Dagre để tính toán vị trí
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 180;
  const nodeHeight = 50;

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction, nodesep: 70, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const useFlowLogic = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(false);

  const generateFlow = useCallback(
    async (text: string) => {
      if (!text) return;
      setLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/generate-flow?text=${encodeURIComponent(text)}`,
        );
        const resData = await response.json();

        if (resData.result === "SUCCESS") {
          // Tự động tính toán vị trí dàn trải ngay tại đây
          const { nodes: layoutedNodes, edges: layoutedEdges } =
            getLayoutedElements(resData.data.nodes, resData.data.edges);

          setNodes(layoutedNodes as unknown as Node[]);
          setEdges(layoutedEdges as unknown as Edge[]);
        } else {
          const message = resData?.message || "Lỗi khi tạo sơ đồ";
          console.error("GenerateFlow error:", message);

          if (process.env.NODE_ENV === "development") {
            // ví dụ mock nodes/edges
            const mock = {
              nodes: [
                {
                  id: "1",
                  data: { label: "Bước 1: Tiếp nhận" },
                  position: { x: 0, y: 0 },
                },
                {
                  id: "2",
                  data: { label: "Bước 2: Khảo sát" },
                  position: { x: 0, y: 100 },
                },
                {
                  id: "3",
                  data: { label: "Bước 3: Lắp đặt" },
                  position: { x: 0, y: 200 },
                },
              ],
              edges: [
                { id: "e1-2", source: "1", target: "2" },
                { id: "e2-3", source: "2", target: "3" },
              ],
            } as { nodes: Node[]; edges: Edge[] };

            const { nodes: layoutedNodes, edges: layoutedEdges } =
              getLayoutedElements(mock.nodes, mock.edges);
            setNodes(layoutedNodes as unknown as Node[]);
            setEdges(layoutedEdges as unknown as Edge[]);
            alert(`${message}\nĐã dùng mock dữ liệu để phát triển giao diện.`);
          } else {
            alert(message);
          }
        }
      } catch (error) {
        console.error("Lỗi:", error);
        alert("Lỗi kết nối Backend!");
      } finally {
        setLoading(false);
      }
    },
    [setNodes, setEdges],
  );

  const uploadFileAndGenerate = useCallback(
    async (file: File) => {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/upload-process",
          {
            method: "POST",
            body: formData,
          },
        );

        const resData = await response.json();
        if (resData.result === "SUCCESS") {
          // Sử dụng logic Dagre đã có để dàn trang
          const { nodes: layoutedNodes, edges: layoutedEdges } =
            getLayoutedElements(resData.data.nodes, resData.data.edges);
          setNodes(layoutedNodes as unknown as Node[]);
          setEdges(layoutedEdges as unknown as Edge[]);
        } else {
          alert("Lỗi: " + resData.message);
        }
      } catch (error) {
        alert("Không thể kết nối Backend!");
      } finally {
        setLoading(false);
      }
    },
    [getLayoutedElements, setNodes, setEdges],
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    loading,
    generateFlow,
    uploadFileAndGenerate,
  };
};
