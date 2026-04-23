/**
 * useDiagramTools — Custom Hook chứa toàn bộ Logic cho công cụ vẽ sơ đồ.
 *
 * Mục đích: Tách biệt hoàn toàn "Logic" khỏi "UI" (Clean Architecture).
 * - BottomToolbar.tsx  → chỉ render giao diện, gọi từ hook này.
 * - DiagramContextMenu.tsx → chỉ render menu, gọi từ hook này.
 *
 * Các nhóm chức năng được quản lý:
 *  1. Thêm node mới (addNodeAtPosition, addNodeAtCenter)
 *  2. Lịch sử (undo, redo)
 *  3. Bố cục tự động (autoLayout)
 *  4. Đổi kiểu dây nối (setEdgeType)
 *  5. Đổi màu node (setNodeColor)
 *  6. Xuất dữ liệu (exportJSON)
 *  7. Xóa node (deleteNodeById)
 *  8. Nhân bản node (duplicateNode)
 *  9. Context menu (openContextMenu, closeContextMenu)
 */

import { useCallback, useState, useRef } from "react";
import { useReactFlow, type Node, type Edge } from "@xyflow/react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { getNodesBounds } from "@xyflow/react";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

/** Trạng thái của Context Menu */
export interface ContextMenuState {
  /** Context menu hiện có đang hiển thị không */
  visible: boolean;
  /** Tọa độ X trên màn hình (clientX) */
  x: number;
  /** Tọa độ Y trên màn hình (clientY) */
  y: number;
  /** Node đang được click phải (null = click vào nền) */
  targetNode: Node | null;
}

/** Kiểu dây nối hợp lệ trong React Flow */
export type EdgeType = "default" | "smoothstep" | "straight" | "bezier";

/** Danh sách các loại node có thể thêm */
export type NewNodeShape = "process" | "decision" | "customNode" | "mindmap" | "text";

/** Props được truyền vào hook từ DrawDiagram để kết nối với useFlowLogic */
export interface DiagramToolsInput {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  autoLayout: (diagramType?: string) => void;
  deleteSelected: () => void;
  addNoteAtCenter: () => void;
  takeSnapshot: () => void;
}

// ─────────────────────────────────────────────────────────────
// HOOK CHÍNH
// ─────────────────────────────────────────────────────────────

export const useDiagramTools = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  undo,
  redo,
  canUndo,
  canRedo,
  autoLayout,
  deleteSelected,
  addNoteAtCenter,
  takeSnapshot,
}: DiagramToolsInput) => {
  // ── Kết nối với React Flow để lấy tọa độ viewport ──
  const { screenToFlowPosition, fitView } = useReactFlow();

  // ── Trạng thái Context Menu ──
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetNode: null,
  });

  // ── Trạng thái clipboard để Paste ──
  const clipboard = useRef<Node | null>(null);

  // ─────────────────────────── 1. THÊM NODE ────────────────────────────

  /**
   * Thêm node mới tại tọa độ màn hình cụ thể.
   * Dùng cho Context Menu "Thêm Node tại đây" khi biết tọa độ chuột.
   *
   * @param clientX  Tọa độ X trên màn hình (từ sự kiện chuột)
   * @param clientY  Tọa độ Y trên màn hình (từ sự kiện chuột)
   * @param shape    Loại hình dạng node cần thêm
   */
  const addNodeAtPosition = useCallback(
    (clientX: number, clientY: number, shape: NewNodeShape = "process") => {
      // Chuyển đổi tọa độ màn hình → tọa độ trong canvas React Flow
      const position = screenToFlowPosition({ x: clientX, y: clientY });
      const id = `node_${Date.now()}`;

      // Xây dựng data mặc định theo từng loại node
      const defaultData: Record<string, any> = {
        process: {
          label: "Bước mới",
          process_type: "step",
          executor: "Chưa gán",
          description: "",
        },
        decision: {
          label: "Điều kiện",
          process_type: "decision",
          executor: "",
          description: "",
        },
        customNode: {
          label: "Node mới",
          type: "task",
          executor: "",
          description: "",
        },
        mindmap: {
          label: "Ý tưởng mới",
          level: "branch",
        },
        text: {
          label: "📝 Nhập văn bản...",
          type: "note",
          executor: "",
          description: "",
        },
      };

      const nodeTypeMap: Record<string, string> = {
        process: "process",
        decision: "process",
        customNode: "customNode",
        mindmap: "mindmap",
        text: "customNode",
      };

      const newNode: Node = {
        id,
        type: nodeTypeMap[shape] ?? "customNode",
        position,
        data: defaultData[shape] ?? { label: "Node mới" },
      };

      setNodes((nds) => nds.concat(newNode));
      setTimeout(takeSnapshot, 50);
      toast.success(`Đã thêm node "${shape}" vào sơ đồ!`);
    },
    [screenToFlowPosition, setNodes, takeSnapshot]
  );

  /**
   * Thêm node mới tại trung tâm màn hình.
   * Dùng cho Bottom Toolbar khi không biết chính xác tọa độ.
   *
   * @param shape  Loại hình dạng node cần thêm
   */
  const addNodeAtCenter = useCallback(
    (shape: NewNodeShape = "process") => {
      // Tính tọa độ trung tâm màn hình
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      addNodeAtPosition(centerX, centerY, shape);
    },
    [addNodeAtPosition]
  );

  // ─────────────────────────── 2. XÓA NODE (by ID) ────────────────────────────

  /**
   * Xóa node theo ID cụ thể.
   * Dùng cho Context Menu trên Node "Xóa Node".
   * Cũng xóa tất cả các cạnh (edge) liên quan đến node đó.
   *
   * @param nodeId  ID của node cần xóa
   */
  const deleteNodeById = useCallback(
    (nodeId: string) => {
      // Xóa node khỏi danh sách
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      // Xóa tất cả edges có nguồn hoặc đích là node này
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
      setTimeout(takeSnapshot, 50);
      toast.success("Đã xóa node!");
    },
    [setNodes, setEdges, takeSnapshot]
  );

  // ─────────────────────────── 3. NHÂN BẢN NODE ────────────────────────────

  /**
   * Sao chép (Duplicate) một node với offset vị trí để phân biệt.
   * Dùng cho Context Menu "Nhân bản".
   *
   * @param nodeId  ID của node cần nhân bản
   */
  const duplicateNode = useCallback(
    (nodeId: string) => {
      const source = nodes.find((n) => n.id === nodeId);
      if (!source) return;

      // Node mới lệch 40px so với node gốc
      const newNode: Node = {
        ...source,
        id: `copy_${Date.now()}`,
        position: {
          x: source.position.x + 40,
          y: source.position.y + 40,
        },
        // Sao chép hoàn toàn data
        data: { ...source.data, label: `${source.data.label} (copy)` },
        selected: false,
      };

      setNodes((nds) => nds.concat(newNode));
      setTimeout(takeSnapshot, 50);
      toast.success("Đã nhân bản node!");
    },
    [nodes, setNodes, takeSnapshot]
  );

  // ─────────────────────────── 4. ĐỔI MÀU NODE ────────────────────────────

  /**
   * Cập nhật màu nền cho một node cụ thể.
   * Dùng cho Context Menu "Đổi màu Node" và Bottom Toolbar "Giao diện".
   *
   * @param nodeId  ID của node cần đổi màu
   * @param color   Mã màu HEX, ví dụ "#4f46e5"
   */
  const setNodeColor = useCallback(
    (nodeId: string, color: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, style: { ...n.style, background: color } }
            : n
        )
      );
      setTimeout(takeSnapshot, 50);
    },
    [setNodes, takeSnapshot]
  );

  // ─────────────────────────── 5. ĐỔI KIỂU DÂY NỐI ────────────────────────────

  /**
   * Thay đổi kiểu dây nối (edge type) cho TẤT CẢ các cạnh trong sơ đồ.
   * Dùng cho Bottom Toolbar "Giao diện > Kiểu dây nối".
   *
   * @param edgeType  Kiểu dây nối: "default" | "smoothstep" | "straight" | "bezier"
   */
  const setEdgeType = useCallback(
    (edgeType: EdgeType) => {
      setEdges((eds) => eds.map((e) => ({ ...e, type: edgeType })));
      toast.success(`Đã đổi kiểu dây nối: ${edgeType}`);
    },
    [setEdges]
  );

  // ─────────────────────────── 6. XUẤT DỮ LIỆU ────────────────────────────

  /**
   * Xuất toàn bộ sơ đồ thành file JSON để backup hoặc chia sẻ.
   * File được download tự động với tên `diagram_<timestamp>.json`.
   */
  const exportJSON = useCallback(() => {
    try {
      // Xây dựng cấu trúc dữ liệu đầy đủ
      const data = { nodes, edges, exportedAt: new Date().toISOString() };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Tạo link ảo và click để download
      const link = document.createElement("a");
      link.href = url;
      link.download = `smartflow_diagram_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Đã xuất file JSON thành công!");
    } catch (err) {
      toast.error("Xuất JSON thất bại!");
    }
  }, [nodes, edges]);

  /**
   * Xuất sơ đồ thành ảnh PNG chất lượng cao.
   * Chụp vùng `.react-flow__viewport` và download tự động.
   */
  const exportPNG = useCallback(async () => {
    const viewport = document.querySelector(
      ".react-flow__viewport"
    ) as HTMLElement;
    if (!viewport) {
      toast.error("Không tìm thấy canvas để xuất!");
      return;
    }

    try {
      toast.loading("Đang xuất PNG...", { id: "export-png" });
      const dataUrl = await toPng(viewport, {
        backgroundColor: "#ffffff",
        quality: 1,
        pixelRatio: 2, // Xuất 2x để ảnh sắc nét
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `smartflow_diagram_${Date.now()}.png`;
      link.click();

      toast.success("Đã xuất PNG thành công!", { id: "export-png" });
    } catch (err) {
      toast.error("Xuất PNG thất bại!", { id: "export-png" });
    }
  }, []);

  // ─────────────────────────── 7. FIT VIEW ────────────────────────────

  /**
   * Thu phóng màn hình để hiển thị vừa khít toàn bộ sơ đồ.
   * Dùng cho Context Menu "Thu phóng vừa màn hình".
   */
  const handleFitView = useCallback(() => {
    fitView({ duration: 600, padding: 0.2 });
  }, [fitView]);

  // ─────────────────────────── 8. CHỌN TẤT CẢ / DÁN ────────────────────────────

  /**
   * Sao chép node vào clipboard nội bộ.
   * @param node  Node cần copy
   */
  const copyNode = useCallback((node: Node) => {
    clipboard.current = node;
    toast.info("Đã copy node vào clipboard!");
  }, []);

  /**
   * Dán node từ clipboard nội bộ tại vị trí con trỏ.
   * @param clientX  Tọa độ X màn hình nơi dán
   * @param clientY  Tọa độ Y màn hình nơi dán
   */
  const pasteNode = useCallback(
    (clientX: number, clientY: number) => {
      if (!clipboard.current) {
        toast.warning("Clipboard trống. Hãy copy một node trước!");
        return;
      }
      const position = screenToFlowPosition({ x: clientX, y: clientY });
      const pasted: Node = {
        ...clipboard.current,
        id: `pasted_${Date.now()}`,
        position,
        selected: false,
        data: {
          ...clipboard.current.data,
          label: `${clipboard.current.data.label} (dán)`,
        },
      };
      setNodes((nds) => nds.concat(pasted));
      setTimeout(takeSnapshot, 50);
      toast.success("Đã dán node!");
    },
    [screenToFlowPosition, setNodes, takeSnapshot]
  );

  /**
   * Chọn tất cả node trên canvas.
   */
  const selectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
    toast.info(`Đã chọn tất cả ${nodes.length} node.`);
  }, [nodes.length, setNodes]);

  // ─────────────────────────── 9. CONTEXT MENU ────────────────────────────

  /**
   * Mở Context Menu khi click chuột phải vào CANVAS (không có node).
   * Được kết nối với sự kiện `onPaneContextMenu` của ReactFlow.
   *
   * @param event  Sự kiện chuột phải React
   */
  const openPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        targetNode: null, // null = đang click vào nền
      });
    },
    []
  );

  /**
   * Mở Context Menu khi click chuột phải vào một NODE cụ thể.
   * Được kết nối với sự kiện `onNodeContextMenu` của ReactFlow.
   *
   * @param event  Sự kiện chuột phải React
   * @param node   Node đang được click phải
   */
  const openNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        targetNode: node, // Lưu node để Context Menu biết nên hiện menu gì
      });
    },
    []
  );

  /**
   * Đóng Context Menu.
   * Được gọi khi click ra ngoài menu hoặc chọn một mục.
   */
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // ─────────────────────────── RETURN ────────────────────────────

  return {
    // Trạng thái
    contextMenu,

    // Thêm node
    addNodeAtCenter,
    addNodeAtPosition,
    addNoteAtCenter,

    // Thao tác node
    deleteNodeById,
    duplicateNode,
    setNodeColor,
    copyNode,
    pasteNode,
    selectAll,

    // Dây nối & giao diện
    setEdgeType,

    // Bố cục
    autoLayout,

    // Lịch sử
    undo,
    redo,
    canUndo,
    canRedo,

    // Xuất dữ liệu
    exportPNG,
    exportJSON,

    // Canvas
    handleFitView,

    // Context Menu
    openPaneContextMenu,
    openNodeContextMenu,
    closeContextMenu,
  };
};
