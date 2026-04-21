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
import { toast } from "sonner";
import { diagramApi } from "../services/diagramApi";

// ─── NODE TYPE MAP ──────────────────────────────────────────────────────────
// Map từ `the_loai` → React Flow node type key (registered in FlowCanvas nodeTypes)
export const NODE_TYPE_MAP: Record<string, string> = {
  // ── Context-Aware NodeRegistry types (NEW) ──
  "org-chart":  "org-chart",
  "org":        "org-chart",
  "layered":    "layer",
  "layer":      "layer",
  "uml":        "uml",
  "uml-class":  "uml",
  "process":    "process",
  "ioffice":    "process",
  "quy-trinh":  "process",
  "workflow":   "process",
  "mindmap":    "mindmap",
  // ── Legacy / enterprise node keys ──
  "network":         "networkNode",
  "ha-tang-mang":    "networkNode",
  "infrastructure":  "networkNode",
  "retro":           "networkNode",
  "kanban":          "iofficeNode",
  "cloud":           "cloudNode",
  "vnpt-cloud":      "cloudNode",
  "kien-truc-cloud": "cloudNode",
  "iot":             "iotNode",
  "smart-city":      "iotNode",
  "ioc":             "iotNode",
  "sequence":        "iotNode",
  "usecase":         "uml",
  "class-diagram":   "uml",
  "flowchart":       "customNode",
  "ai":              "customNode",
};

// ─── LAYOUT DIRECTION MAP ────────────────────────────────────────────────────
// TB = Top-to-Bottom (org chart, layered)
// LR = Left-to-Right (process, ioffice, sequence)
export const LAYOUT_DIRECTION_MAP: Record<string, "TB" | "LR"> = {
  "org-chart":    "TB",
  "org":          "TB",
  "layered":      "TB",
  "layer":        "TB",
  "uml":          "TB",
  "uml-class":    "TB",
  "process":      "LR",
  "ioffice":      "LR",
  "quy-trinh":    "LR",
  "workflow":     "LR",
  "mindmap":      "TB",
  "network":      "TB",
  "infrastructure":"TB",
  "cloud":        "TB",
  "iot":          "LR",
  "smart-city":   "LR",
};

/**
 * Resolve node type từ the_loai của sơ đồ.
 * Fallback về "customNode" nếu không map được.
 */
const resolveNodeType = (theLoai?: string): string => {
  if (!theLoai) return "customNode";
  const key = theLoai.toLowerCase().trim();
  return NODE_TYPE_MAP[key] ?? "customNode";
};

/**
 * getLayoutedElements — Tự động chọn hướng dựa trên the_loai
 * TB (Top-Bottom): Org Chart, UML, Layered
 * LR (Left-Right): Process, iOffice, Workflow
 */
export const calculateLayout = (
  nodes: Node[],
  edges: Edge[],
  structure: string = "logic",
) => {
  const t = structure.toLowerCase();
  const isMindMap = t === "mindmap";
  const isOrgChart = t === "org-chart" || t === "org";
  const isHorizontal = t === "process" || t === "ioffice" || t === "layered" || t === "logic";
  
  // Tự động điều chỉnh kiểu liên kết (edge type) theo cấu trúc
  const finalEdges = edges.map((e) => ({
    ...e,
    type: isMindMap ? "bezier" : (isOrgChart ? "smoothstep" : "step"),
  }));

  // ── 1. THUẬT TOÁN ĐẶC QUYỀN CHO MINDMAP (Toả ra 2 bên) ──
  if (isMindMap && nodes.length > 0) {
    // Bước 1: Tìm Node Gốc
    const inDegrees: Record<string, number> = {};
    nodes.forEach(n => inDegrees[n.id] = 0);
    finalEdges.forEach(e => { if (inDegrees[e.target] !== undefined) inDegrees[e.target]++; });
    
    let root = nodes.find(n => inDegrees[n.id] === 0);
    if (!root) root = nodes[0]; // Fallback

    if (root) {
      // Bước 2: Chia nhánh con thành Left và Right
      const rootEdges = finalEdges.filter(e => e.source === root!.id);
      const leftChildren = new Set<string>();
      const rightChildren = new Set<string>();
      
      rootEdges.forEach((e, index) => {
        // Chia đều sang hai bên
        if (index % 2 === 0) rightChildren.add(e.target);
        else leftChildren.add(e.target);
      });

      // BFS lan truyền
      const buildSet = (startNodes: Set<string>, targetSet: Set<string>) => {
        let queue = Array.from(startNodes);
        while (queue.length > 0) {
          const curr = queue.shift()!;
          targetSet.add(curr);
          finalEdges.filter(e => e.source === curr).forEach(e => {
            if (!targetSet.has(e.target)) queue.push(e.target);
          });
        }
      };
      
      const leftNodesSet = new Set<string>();
      buildSet(leftChildren, leftNodesSet);
      
      const rightNodesSet = new Set<string>();
      buildSet(rightChildren, rightNodesSet);

      const nodeW = 280;
      const nodeH = 120;

      // Bước 3: Chạy Dagre 2 lần (Trái sang Phải và Phải sang Trái)
      const runDagre = (dir: "LR" | "RL", nodeSet: Set<string>) => {
        const g = new dagre.graphlib.Graph();
        g.setGraph({ rankdir: dir, nodesep: 60, ranksep: 150 });
        g.setDefaultEdgeLabel(() => ({}));
        g.setNode(root!.id, { width: nodeW, height: nodeH });
        
        nodeSet.forEach(id => g.setNode(id, { width: nodeW, height: nodeH }));
        finalEdges.forEach(e => {
          if (e.source === root!.id && nodeSet.has(e.target)) g.setEdge(e.source, e.target);
          else if (nodeSet.has(e.source) && nodeSet.has(e.target)) g.setEdge(e.source, e.target);
        });
        dagre.layout(g);
        return g;
      };

      const gRight = runDagre("LR", rightNodesSet);
      const gLeft = runDagre("RL", leftNodesSet);
      
      const rootRightPos = gRight.node(root.id);
      const rootLeftPos = gLeft.node(root.id);

      // Bước 4: Gộp tọa độ và inject Smooth Transition Style
      const outNodes = nodes.map(node => {
        let x = 0;
        let y = 0;
        let targetP = "left";
        let sourceP = "right";
        let isRoot = false;

        if (node.id === root!.id) {
          isRoot = true;
          x = 0;
          y = 0;
        } else if (rightNodesSet.has(node.id)) {
          const p = gRight.node(node.id);
          x = p.x - rootRightPos.x;
          y = p.y - rootRightPos.y;
          targetP = "left";
          sourceP = "right";
        } else if (leftNodesSet.has(node.id)) {
          const p = gLeft.node(node.id);
          x = p.x - rootLeftPos.x;
          y = p.y - rootLeftPos.y;
          targetP = "right";
          sourceP = "left";
        }

        return {
          ...node,
          targetPosition: targetP,
          sourcePosition: sourceP,
          data: { ...node.data, isRoot }, // truyền cờ isRoot để CustomNode render 2 Handle
          style: { 
            ...node.style, 
            transition: "transform 0.5s ease-in-out, opacity 0.5s ease-in-out" 
          },
          position: { x: Math.round(x), y: Math.round(y) }
        };
      });

      return { nodes: outNodes, edges: finalEdges };
    }
  }

  // ── 2 + 3. THUẬT TOÁN CHUẨN DAGRE (Org Chart = TB, Process = LR) ──
  const rankDir = isHorizontal ? "LR" : "TB";
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Node size hints
  const nodeW = rankDir === "LR" ? 260 : 300;
  const nodeH = rankDir === "LR" ? 130 : 170;

  let customNodeSep = rankDir === "LR" ? 80 : 100;
  let customRankSep = rankDir === "LR" ? 150 : 200;

  if (isOrgChart) {
    customNodeSep = 150;
    customRankSep = 150;
  }

  dagreGraph.setGraph({
    rankdir: rankDir,
    nodesep: customNodeSep,
    ranksep: customRankSep,
    align: undefined,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeW, height: nodeH });
  });
  finalEdges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);

  // Hiệu ứng Smooth Transition
  return {
    nodes: nodes.map((node) => {
      const pos = dagreGraph.node(node.id);
      if (!pos) return node;
      return {
        ...node,
        // Ép vị trí Target/Source strict theo hướng luồng
        targetPosition: rankDir === "LR" ? "left" : "top",
        sourcePosition: rankDir === "LR" ? "right" : "bottom",
        style: { 
          ...node.style, 
          transition: "transform 0.5s ease-in-out, opacity 0.5s ease-in-out" 
        },
        position: {
          x: Math.round(pos.x - nodeW / 2),
          y: Math.round(pos.y - nodeH / 2),
        },
      };
    }),
    edges: finalEdges,
  };
};

/** Resolve layout direction from the_loai */
const resolveLayoutDirection = (theLoai?: string): "TB" | "LR" => {
  if (!theLoai) return "TB";
  return LAYOUT_DIRECTION_MAP[theLoai.toLowerCase()] ?? "TB";
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
  const { screenToFlowPosition, fitView } = useReactFlow();
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

  // --- 3. LOGIC NORMALIZE (hỗ trợ NODE_TYPE_MAP) ---
  /**
   * @param data       Dữ liệu raw từ AI { nodes, edges }
   * @param diagramType  Thể loại sơ đồ (the_loai) để map node type
   */
  const normalizeGraph = (data: any, diagramType?: string) => {
    const rawNodes = data?.nodes ?? [];
    const rawEdges = data?.edges ?? [];
    const resolvedType = resolveNodeType(diagramType);

    const nodesOut = rawNodes.map((n: any) => ({
      ...n,
      // Ưu tiên type đã có sẵn trong data (nếu AI trả về explicit type)
      // Nếu không có → dùng resolvedType từ NODE_TYPE_MAP
      type: n.type && n.type !== "customNode" ? n.type : resolvedType,
      data: { ...n.data, label: n.label || n.data?.label || "" },
    }));

    const edgesOut = rawEdges
      .map((e: any, i: number) => ({
        id: e.id || `e${i}`,
        source: String(e.source || ""),
        target: String(e.target || ""),
        type: "default",
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 3 },
        markerEnd: { type: "arrowclosed", color: "#6366f1" },
      }))
      .filter((ed: any) => ed.source && ed.target);

    return { nodes: nodesOut, edges: edgesOut };
  };

  // --- 4. API CALLS ---
  /**
   * Sinh / chỉnh sửa sơ đồ bằng AI.
   * @param text          Prompt của người dùng
   * @param provider      gemini | ollama
   * @param currentNodes  Nodes hiện tại trên canvas (Chat-to-Edit)
   * @param currentEdges  Edges hiện tại trên canvas (Chat-to-Edit)
   * @param diagramType   Thể loại sơ đồ để resolve node type
   */
  const generateFlow = useCallback(
    async (
      text: string,
      provider: string = "gemini",
      currentNodes?: Node[],
      currentEdges?: Edge[],
      diagramType?: string,
    ) => {
      if (!text) return;
      setIsGenerating(true);
      try {
        const response = await diagramApi.generateFlowText(
          text,
          provider,
          currentNodes,
          currentEdges,
          diagramType,   // ← pass the_loai to backend for Context-Aware prompt
        );

        const resData = response;

        if (resData.result === "SUCCESS") {
          const normalized = normalizeGraph(resData.data, diagramType);
          console.log("[useFlowLogic] Normalized:", normalized);

          if (!normalized.nodes || normalized.nodes.length === 0) {
            toast.warning(
              "AI trả về dữ liệu trống. Vui lòng thử lại với prompt chi tiết hơn.",
            );
            return;
          }

          // ─ Auto-layout direction based on diagram type ─
          const { nodes: lNodes, edges: lEdges } = calculateLayout(
            normalized.nodes,
            normalized.edges,
            diagramType || "logic",
          );
          setNodes(lNodes as Node[]);
          setEdges(lEdges as Edge[]);
          setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 50);
          setTimeout(takeSnapshot, 100);
        } else {
          toast.error(resData.message ?? "AI không thể xử lý yêu cầu này.");
        }
      } catch (error) {
        console.error(error);
        toast.error("Lỗi kết nối tới AI backend. Kiểm tra lại server.");
      } finally {
        setIsGenerating(false);
      }
    },
    [setNodes, setEdges, takeSnapshot],
  );

  const uploadFileAndGenerate = useCallback(
    async (file: File, provider: string = "gemini") => {
      setIsGenerating(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("provider", provider);
      formData.append("is_internal", provider === "ollama" ? "true" : "false");
      try {
        const response = await diagramApi.uploadProcessImage(formData);
        const resData = response;
        if (resData.result === "SUCCESS") {
          const normalized = normalizeGraph(resData.data);
          const { nodes: lNodes, edges: lEdges } = calculateLayout(
            normalized.nodes,
            normalized.edges,
            "logic"
          );
          setNodes(lNodes as Node[]);
          setEdges(lEdges as Edge[]);
          setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 50);
          setTimeout(takeSnapshot, 100);
        } else {
          toast.error(resData.message ?? "Không thể phân tích file. Vui lòng thử lại.");
        }
      } catch (error) {
        toast.error("Lỗi kết nối tới server khi xử lý file!");
      } finally {
        setIsGenerating(false);
      }
    },
    [setNodes, setEdges, takeSnapshot],
  );

  const applyAutoLayout = useCallback((diagramType?: string) => {
    try {
      const { nodes: lNodes, edges: lEdges } = calculateLayout(
        nodes,
        edges,
        diagramType || "logic",
      );
      setNodes(lNodes as Node[]);
      setEdges(lEdges as Edge[]);
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 50);
      // snapshot after layout
      setTimeout(takeSnapshot, 100);
    } catch (err) {
      console.error("applyAutoLayout failed", err);
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
      setEdges((eds) =>
        addEdge({ ...params, animated: true, type: "bezier" }, eds),
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
        type: type,
        position,
        data: {
          label:
            type === "conditionNode" ? "Điều kiện mới" : "Bước nghiệp vụ mới",
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
    const nodeIds = selectedElements
      .filter((s) => s?.id && s?.position)
      .map((n) => n.id);
    const edgeIds = selectedElements
      .filter((s) => s?.source && s?.target)
      .map((e) => e.id);
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
    applyAutoLayout,
    autoLayout: applyAutoLayout, // Keep alias for existing code
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
