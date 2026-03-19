import { useState, useCallback, useRef } from "react";
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";

// --- LOGIC LAYOUT (GIỮ NGUYÊN CỦA HƯNG) ---
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB",
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 150, ranksep: 200 });
  nodes.forEach((node) =>
    dagreGraph.setNode(node.id, { width: 280, height: 160 }),
  );
  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);
  return {
    nodes: nodes.map((node) => {
      const { x, y } = dagreGraph.node(node.id);
      return { ...node, position: { x: x - 140, y: y - 80 } };
    }),
    edges,
  };
};

export const useFlowLogic = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(false);

  // --- 1. QUẢN LÝ LỊCH SỬ (UNDO/REDO) ---
  // Đặt tên là flowHistory để tránh trùng với window.history của trình duyệt
  const flowHistory = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const takeSnapshot = useCallback(() => {
    const newState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    const newHistory = flowHistory.current.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) newHistory.shift();
    flowHistory.current = newHistory;
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prevState = flowHistory.current[historyIndex - 1];
    setNodes(prevState.nodes);
    setEdges(prevState.edges);
    setHistoryIndex(historyIndex - 1);
  }, [historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex >= flowHistory.current.length - 1) return;
    const nextState = flowHistory.current[historyIndex + 1];
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setHistoryIndex(historyIndex + 1);
  }, [historyIndex, setNodes, setEdges]);

  // --- 2. CHẾ ĐỘ THIẾT KẾ (DRAW MODE) ---
  const [drawMode, setDrawMode] = useState<{
    type: "select" | "pen" | "eraser" | "text";
    color: string;
    size: number;
  }>({ type: "select", color: "#6366f1", size: 4 });

  // --- 3. LOGIC NORMALIZE (GIỮ NGUYÊN CỦA HƯNG) ---
  const normalizeGraph = (data: any) => {
    const rawNodes = data?.nodes ?? [];
    const rawEdges = data?.edges ?? [];

    const nodesOut = rawNodes.map((n: any) => ({
      ...n,
      type: "customNode",
      data: { ...n.data, label: n.label || n.data?.label || "" },
    }));

    const edgesOut = rawEdges
      .map((e: any, i: number) => ({
        id: e.id || `e${i}`,
        source: String(e.source || ""),
        target: String(e.target || ""),
        type: "smoothstep",
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 3 },
        markerEnd: { type: "arrowclosed", color: "#6366f1" },
      }))
      .filter((ed: any) => ed.source && ed.target);

    return { nodes: nodesOut, edges: edgesOut };
  };

  // --- 4. API CALLS ---
  const generateFlow = useCallback(
    async (text: string) => {
      if (!text) return;
      setLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/generate-flow?text=${encodeURIComponent(text)}`,
          { method: "POST" },
        );
        const resData = await response.json();
        if (resData.result === "SUCCESS") {
          const normalized = normalizeGraph(resData.data);
          const { nodes: lNodes, edges: lEdges } = getLayoutedElements(
            normalized.nodes,
            normalized.edges,
          );
          setNodes(lNodes as Node[]);
          setEdges(lEdges as Edge[]);
          // Lưu lịch sử sau khi AI tạo xong
          setTimeout(takeSnapshot, 100);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [setNodes, setEdges, takeSnapshot],
  );

  const uploadFileAndGenerate = useCallback(
    async (file: File) => {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/upload-process",
          { method: "POST", body: formData },
        );
        const resData = await response.json();
        if (resData.result === "SUCCESS") {
          const normalized = normalizeGraph(resData.data);
          const { nodes: lNodes, edges: lEdges } = getLayoutedElements(
            normalized.nodes,
            normalized.edges,
          );
          setNodes(lNodes as Node[]);
          setEdges(lEdges as Edge[]);
          setTimeout(takeSnapshot, 100);
        }
      } catch (error) {
        alert("Lỗi kết nối!");
      } finally {
        setLoading(false);
      }
    },
    [setNodes, setEdges, takeSnapshot],
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

    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < flowHistory.current.length - 1,
    drawMode,
    setDrawMode,
    takeSnapshot,
  };
};
