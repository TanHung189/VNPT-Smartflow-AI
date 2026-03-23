import { useState, useCallback, useRef } from "react";
import {
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  type Node,
  type Edge,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { diagramApi } from "../services/diagramApi";

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
  const [isGenerating, setIsGenerating] = useState(false);
  // freehand strokes (kept in the diagram state so undo/redo includes them)
  type Stroke = { id: string; points: number[]; color: string; size: number };
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  // --- 1. QUẢN LÝ LỊCH SỬ (UNDO/REDO) ---
  type Snapshot = { nodes: Node[]; edges: Edge[]; strokes?: Stroke[] };
  const flowHistory = useRef<Snapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { screenToFlowPosition } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedElements, setSelectedElements] = useState<any[]>([]);

  const takeSnapshot = useCallback(() => {
    const newState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      strokes: JSON.parse(JSON.stringify(strokes)),
    };
    const newHistory = flowHistory.current.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) newHistory.shift();
    flowHistory.current = newHistory;
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, historyIndex, strokes]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prevState = flowHistory.current[historyIndex - 1];
    setNodes(prevState.nodes);
    setEdges(prevState.edges);
    // restore strokes if present
    if (prevState.strokes) setStrokes(prevState.strokes);
    setHistoryIndex(historyIndex - 1);
  }, [historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex >= flowHistory.current.length - 1) return;
    const nextState = flowHistory.current[historyIndex + 1];
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    if (nextState.strokes) setStrokes(nextState.strokes);
    setHistoryIndex(historyIndex + 1);
  }, [historyIndex, setNodes, setEdges]);

  // --- 2. CHẾ ĐỘ THIẾT KẾ (DRAW MODE) ---
  const [drawMode, setDrawMode] = useState<{
    type: "select" | "pen" | "eraser" | "text";
    color: string;
    size: number;
  }>({ type: "select", color: "#6366f1", size: 4 });

  // --- 6. STROKE ACTIONS (PEN / ERASER) ---
  const generateId = () =>
    `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const addStroke = useCallback(
    (points: number[], color?: string, size?: number) => {
      const s = {
        id: generateId(),
        points,
        color: color || drawMode.color,
        size: size || drawMode.size,
      };
      setStrokes((st) => st.concat(s));
      // also snapshot so undo includes strokes
      setTimeout(takeSnapshot, 50);
    },
    [drawMode.color, drawMode.size, takeSnapshot],
  );

  const undoStroke = useCallback(() => {
    setStrokes((s) => s.slice(0, -1));
    setTimeout(takeSnapshot, 50);
  }, [takeSnapshot]);

  const clearStrokes = useCallback(() => {
    setStrokes([]);
    setTimeout(takeSnapshot, 50);
  }, [takeSnapshot]);

  // erase strokes that have any point within `radius` of (x,y)
  const eraseAt = useCallback(
    (x: number, y: number, radius: number) => {
      setStrokes((s) =>
        s.filter((stroke) => {
          for (let i = 0; i < stroke.points.length; i += 2) {
            const dx = stroke.points[i] - x;
            const dy = stroke.points[i + 1] - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= radius) return false; // remove this stroke
          }
          return true;
        }),
      );
      setTimeout(takeSnapshot, 50);
    },
    [takeSnapshot],
  );

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
      setIsGenerating(true);
      try {
        const response = await diagramApi.generateFlowText(text);
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
        setIsGenerating(false);
      }
    },
    [setNodes, setEdges, takeSnapshot],
  );

  const uploadFileAndGenerate = useCallback(
    async (file: File) => {
      setIsGenerating(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await diagramApi.uploadProcessImage(formData);
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
        setIsGenerating(false);
      }
    },
    [setNodes, setEdges, takeSnapshot],
  );

  const autoLayout = useCallback(() => {
    try {
      const { nodes: lNodes, edges: lEdges } = getLayoutedElements(
        nodes,
        edges,
      );
      setNodes(lNodes as Node[]);
      setEdges(lEdges as Edge[]);
      // snapshot after layout
      setTimeout(takeSnapshot, 50);
    } catch (err) {
      console.error("autoLayout failed", err);
    }
  }, [nodes, edges, setNodes, setEdges, takeSnapshot]);

  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setStrokes([]);
    setTimeout(takeSnapshot, 50);
  }, [setNodes, setEdges, setStrokes, takeSnapshot]);

  // --- 5. TƯƠNG TÁC KÉO/THẢ VÀ NODE ---
  const onConnect = useCallback(
    (params: any) => {
      setEdges((eds) => addEdge({ ...params, animated: true, type: "smoothstep" }, eds));
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
        type: type,
        position,
        data: {
          label: type === "conditionNode" ? "Điều kiện mới" : "Bước nghiệp vụ mới",
          type: type === "conditionNode" ? "decision" : "task",
          executor: "Chưa gán",
          description: "",
        },
      };
      setNodes((nds) => nds.concat(newNode as Node));
      if (takeSnapshot) takeSnapshot();
    },
    [screenToFlowPosition, setNodes, takeSnapshot],
  );

  const onSelectionChange = useCallback((elements: any) => {
    let elementsArray: any[] = [];
    if (Array.isArray(elements)) {
      elementsArray = elements;
    } else if (elements && typeof elements === "object") {
      if (Array.isArray(elements.nodes) || Array.isArray(elements.edges)) {
        elementsArray = [...(elements.nodes || []), ...(elements.edges || [])];
      } else if (Array.isArray((elements as any).selected)) {
        elementsArray = (elements as any).selected;
      } else {
        elementsArray = [elements];
      }
    }
    setSelectedElements(elementsArray);
    const node = elementsArray.find((el: any) => el?.data);
    setSelectedNode(node || null);
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedElements || selectedElements.length === 0) return;
    const nodeIds = selectedElements.filter((s) => s?.id && s?.position).map((n) => n.id);
    const edgeIds = selectedElements.filter((s) => s?.source && s?.target).map((e) => e.id);
    if (nodeIds.length) {
      setNodes((nds) => nds.filter((n) => !nodeIds.includes(n.id)));
    }
    if (edgeIds.length) {
      setEdges((eds) => eds.filter((e) => !edgeIds.includes(e.id)));
    }
    setSelectedElements([]);
    setSelectedNode(null);
    if (takeSnapshot) takeSnapshot();
  }, [selectedElements, setNodes, setEdges, takeSnapshot]);

  const addNoteAtCenter = useCallback(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const pos = screenToFlowPosition({ x: centerX, y: centerY });
    const newNode = {
      id: `note_${Date.now()}`,
      type: "customNode",
      position: pos,
      data: { label: "Ghi chú", type: "note", executor: "", description: "" },
    };
    setNodes((nds) => nds.concat(newNode as Node));
    if (takeSnapshot) takeSnapshot();
  }, [screenToFlowPosition, setNodes, takeSnapshot]);

  const updateNodeData = (field: string, value: string) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id ? { ...n, data: { ...n.data, [field]: value } } : n,
      ),
    );
    setSelectedNode((prev: any) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
    }));
  };

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    isGenerating,
    generateFlow,
    uploadFileAndGenerate,
    // history
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < flowHistory.current.length - 1,
    // drawing
    drawMode,
    setDrawMode,
    strokes,
    addStroke,
    undoStroke,
    clearStrokes,
    eraseAt,
    // utilities
    autoLayout,
    clearAll,
    takeSnapshot,
    // canvas interactions
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
  };
};
