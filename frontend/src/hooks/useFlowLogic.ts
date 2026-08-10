import { useState, useCallback, useRef } from "react";
import {
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  type Node,
  type Edge,
} from "@xyflow/react";
import { toast } from "sonner";
import { diagramApi } from "../services/diagramApi";
import { getElkLayoutedElements } from "../utils/elkLayout";

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
  "mindmap":    "mindmapNode",   // Mindmap → MindmapNode component mới
  "mindmapNode":"mindmapNode",   // Đã có sẵn type đúng từ AI

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
    const isMindmap = diagramType === "mindmap" || diagramType === "mindmapNode";

    const nodesOut = rawNodes.map((n: any) => ({
      ...n,
      // Giữ lại type nếu nó đã được map trong NODE_TYPE_MAP (từ AI trả về đúng schema)
      // Fallback về resolvedType nếu type chưa biết hoặc là giá trị lạ
      type: (n.type && NODE_TYPE_MAP[n.type.toLowerCase()]) ? NODE_TYPE_MAP[n.type.toLowerCase()] : resolvedType,
      data: {
        ...n.data,                         // bảo toàn isRoot, isExpanded, level từ AI
        label: n.label || n.data?.label || "",
        // Đảm bảo isExpanded mặc định là true cho tất cả nodes mới tạo
        isExpanded: n.data?.isExpanded ?? true,
        // Bảo tồn process_type từ AI (dùng bởi ProcessNode)
        process_type: n.data?.process_type || n.data?.type || n.type,
      },
    }));

    const edgesOut = rawEdges
      .map((e: any, i: number) => ({
        id: e.id || `e${i}`,
        source: String(e.source || ""),
        target: String(e.target || ""),
        // Mindmap dùng smoothstep, các loại khác dùng default
        type: isMindmap ? "smoothstep" : "default",
        animated: !isMindmap,
        style: { stroke: "#6366f1", strokeWidth: isMindmap ? 2 : 3 },
        markerEnd: { type: "arrowclosed", color: "#6366f1" },
      }))
      .filter((ed: any) => ed.source && ed.target);

    return { nodes: nodesOut, edges: edgesOut };
  };

  // --- 4. API CALLS ---
  /**
   * Sinh / chỉnh sửa sơ đồ bằng AI.
   *
   * ELK là async: chúng ta await Promise trước khi gọi setNodes / setEdges
   * để đảm bảo canvas chỉ nhận vị trí đã được tính toán đầy đủ.
   *
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
    ): Promise<{ success: boolean; errorMsg?: string }> => {
      if (!text) return { success: false, errorMsg: "Prompt rỗng." };
      setIsGenerating(true);
      try {
        const response = await diagramApi.generateFlowText(
          text,
          provider,
          currentNodes,
          currentEdges,
          diagramType,
        );

        const resData = response;

        if (resData.result === "SUCCESS") {
          const normalized = normalizeGraph(resData.data, diagramType);
          console.log("[useFlowLogic] Normalized:", normalized);

          if (!normalized.nodes || normalized.nodes.length === 0) {
            return {
              success: false,
              errorMsg:
                "AI trả về dữ liệu trống. Vui lòng thử lại với prompt chi tiết hơn.",
            };
          }

          // ─ ELK async layout: await Promise trước khi render ─────────────
          const { nodes: lNodes, edges: lEdges } =
            await getElkLayoutedElements(
              normalized.nodes,
              normalized.edges,
              diagramType || "logic",
            );

          // Chỉ gọi setNodes / setEdges SAU KHI ELK Promise đã resolve
          setNodes(lNodes as Node[]);
          setEdges(lEdges as Edge[]);
          setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 50);
          setTimeout(takeSnapshot, 100);
          return { success: true };
        } else {
          return {
            success: false,
            errorMsg:
              resData.message ??
              "AI không thể xử lý yêu cầu định dạng lược đồ, vui lòng cung cấp phân rã chi tiết hơn.",
          };
        }
      } catch (error) {
        console.error("AI Generate Error Pipeline:", error);
        return {
          success: false,
          errorMsg:
            "Lỗi phân tích JSON hoặc mất kết nối tới AI backend. Xin hãy thử lại với một prompt cô đọng hơn.",
        };
      } finally {
        setIsGenerating(false);
      }
    },
    [setNodes, setEdges, takeSnapshot, fitView],
  );

  const uploadFileAndGenerate = useCallback(
    async (file: File, provider: string = "gemini", diagramType: string = "process") => {
      setIsGenerating(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("provider", provider);
      formData.append("is_internal", provider === "ollama" ? "true" : "false");
      formData.append("the_loai", "auto"); // Đổi thành auto để Backend tự động nhận diện loại sơ đồ phù hợp với file (VD: CV -> Mindmap)
      try {
        const response = await diagramApi.uploadProcessImage(formData);
        const resData = response;
        if (resData.result === "SUCCESS") {
          const normalized = normalizeGraph(resData.data, diagramType);

          // ─ ELK async layout ───────────────────────────────────────────────
          const { nodes: lNodes, edges: lEdges } =
            await getElkLayoutedElements(
              normalized.nodes,
              normalized.edges,
              diagramType, // ← dùng đúng loại sơ đồ thay vì hard-code "logic"
            );

          setNodes(lNodes as Node[]);
          setEdges(lEdges as Edge[]);
          setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 50);
          setTimeout(takeSnapshot, 100);
          return true;
        } else {
          toast.error(
            resData.message ?? "Không thể phân tích file. Vui lòng thử lại.",
          );
          return false;
        }
      } catch (error) {
        toast.error("Lỗi kết nối tới server khi xử lý file!");
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [setNodes, setEdges, takeSnapshot, fitView],
  );

  /**
   * uploadImageAndGenerate — Vision AI
   * Upload ảnh (PNG/JPG/JPEG/WEBP) → Gemini Vision phân tích → Render sơ đồ
   */
  const uploadImageAndGenerate = useCallback(
    async (imageFile: File, diagramType: string = "process"): Promise<boolean> => {
      const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
      if (!ALLOWED.includes(imageFile.type)) {
        toast.error("Chỉ hỗ trợ ảnh PNG, JPG, WEBP, GIF!");
        return false;
      }
      if (imageFile.size > 20 * 1024 * 1024) {
        toast.error("Ảnh không được vượt quá 20MB!");
        return false;
      }

      setIsGenerating(true);
      try {
        const response = await diagramApi.generateFlowFromImage(imageFile, diagramType);
        if (response.result === "SUCCESS") {
          const normalized = normalizeGraph(response.data, diagramType);
          if (!normalized.nodes || normalized.nodes.length === 0) {
            toast.error("AI không tìm thấy sơ đồ trong ảnh. Hãy thử ảnh rõ hơn!");
            return false;
          }
          const { nodes: lNodes, edges: lEdges } = await getElkLayoutedElements(
            normalized.nodes,
            normalized.edges,
            diagramType,
          );
          setNodes(lNodes as Node[]);
          setEdges(lEdges as Edge[]);
          setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 50);
          setTimeout(takeSnapshot, 100);
          return true;
        } else {
          toast.error(response.message ?? "Vision AI không thể phân tích ảnh này.");
          return false;
        }
      } catch (err) {
        toast.error("Lỗi kết nối tới Vision AI!");
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [setNodes, setEdges, takeSnapshot, fitView],
  );

  /**
   * applyAutoLayout — gọi thủ công từ toolbar.
   * Async vì ELK trả về Promise; hàm ngoài có thể await nếu cần.
   */
  const applyAutoLayout = useCallback(
    async (diagramType?: string) => {
      try {
        const { nodes: lNodes, edges: lEdges } = await getElkLayoutedElements(
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
    },
    [nodes, edges, setNodes, setEdges, takeSnapshot, fitView],
  );

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
    uploadImageAndGenerate,
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
