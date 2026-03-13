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
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // TĂNG KÍCH THƯỚC để Dagre tính toán khoảng cách rộng rãi hơn
  const nodeWidth = 280;
  const nodeHeight = 160;

  const isHorizontal = direction === "LR";
  // TĂNG nodesep (ngang) và ranksep (dọc) để các Node không dính nhau
  dagreGraph.setGraph({
    rankdir: direction, // "TB" là từ trên xuống, "LR" là từ trái sang
    nodesep: 150, // Tăng từ 70 lên 150: Khoảng cách giữa các Node cùng hàng rộng ra
    ranksep: 200, // Tăng từ 100 lên 200: Khoảng cách giữa các tầng Node xa ra
    marginx: 50,
    marginy: 50,
  });

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

  const normalizeGraph = (data: any) => {
    const rawNodes = data?.nodes ?? [];
    const rawEdges = data?.edges ?? [];

    // 1. Phối màu đa dạng (SaaS Vivid Palette)
    // Mình phối thêm các tông Indigo và Violet để không chỉ có xanh-trắng
    const nodeTypesConfig: Record<
      string,
      { bg: string; border: string; text: string; glow: string }
    > = {
      start: {
        bg: "#ecfdf5",
        border: "#10b981",
        text: "#065f46",
        glow: "rgba(16, 185, 129, 0.2)",
      }, // Emerald
      decision: {
        bg: "#fffbeb",
        border: "#f59e0b",
        text: "#92400e",
        glow: "rgba(245, 158, 11, 0.2)",
      }, // Amber
      end: {
        bg: "#fff1f2",
        border: "#f43f5e",
        text: "#9f1239",
        glow: "rgba(244, 63, 94, 0.2)",
      }, // Rose
      process: {
        bg: "#f5f3ff",
        border: "#8b5cf6",
        text: "#4c1d95",
        glow: "rgba(139, 92, 246, 0.2)",
      }, // Violet/Indigo
    };

    const nodesOut = rawNodes.map((n: any) => {
      const label = n.label || n.data?.label || "";
      let category = "process";

      if (
        label.toLowerCase().includes("bắt đầu") ||
        label.toLowerCase().includes("tiếp nhận")
      )
        category = "start";
      else if (
        label.toLowerCase().includes("kiểm tra") ||
        label.toLowerCase().includes("phê duyệt")
      )
        category = "decision";
      else if (
        label.toLowerCase().includes("kết thúc") ||
        label.toLowerCase().includes("hoàn thành")
      )
        category = "end";

      const config = nodeTypesConfig[category];

      return {
        ...n,
        type: "customNode",
        data: { ...n.data, label, type: category },
        // Xóa style cứng ở đây vì chúng ta sẽ dùng trong SmartNode.tsx cho đẹp hơn
      };
    });

    const edgesOut: Edge[] = rawEdges
      .map((e: any, i: number) => {
        const source = String(e.source ?? e.from ?? e.src ?? e.sourceId ?? "");
        const target = String(e.target ?? e.to ?? e.dst ?? e.targetId ?? "");

        return {
          id: String(e.id ?? `e${i}-${source}-${target}`),
          source: String(source ?? ""),
          target: String(target ?? ""),
          type: "smoothstep", // Sử dụng đường nối vuông góc nhưng có bo góc
          animated: true,
          pathOptions: { borderRadius: 25 }, // Bo góc mạnh để đường nối mềm mại
          style: {
            stroke: "#6366f1",
            strokeWidth: 3,
            transition: "stroke-width 0.2s",
          },
          markerEnd: {
            type: "arrowclosed",
            color: "#6366f1",
            width: 25, // Tăng kích thước mũi tên
            height: 25,
          },
        };
      })
      .filter((ed: any) => ed.source && ed.target);

    return { nodes: nodesOut, edges: edgesOut };
  };

  // ... các hàm generateFlow và upload giữ nguyên logic, chỉ gọi normalizeGraph đã sửa
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
          const normalized = normalizeGraph(resData.data);
          const { nodes: layoutedNodes, edges: layoutedEdges } =
            getLayoutedElements(normalized.nodes, normalized.edges);
          setNodes(layoutedNodes as unknown as Node[]);
          setEdges(layoutedEdges as unknown as Edge[]);
        }
      } catch (error) {
        console.error(error);
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
        console.debug("uploadProcess response:", resData);
        if (resData.result === "SUCCESS") {
          const normalized = normalizeGraph(resData.data);
          const { nodes: layoutedNodes, edges: layoutedEdges } =
            getLayoutedElements(normalized.nodes, normalized.edges);
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
    [setNodes, setEdges],
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    loading,
    generateFlow,
    uploadFileAndGenerate,
  };
};
