/**
 * useMindmapLayout.ts  — v3 (STABLE)
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook điều phối ẩn/hiện nhánh Mindmap + chạy ELK layout.
 *
 * Thiết kế an toàn (tránh vòng lặp vô hạn):
 *   - Dependency: chỉ string KEY (không phải array nodes/edges trực tiếp).
 *   - Dùng `useRef` để lưu snapshot mới nhất của nodes/edges
 *     mà không khai báo chúng là dependency.
 *   - `layoutRunning` ref làm mutex, tránh gọi ELK chồng nhau.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useCallback, useRef } from "react";
import { useReactFlow, Node, Edge, MarkerType } from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";

// ─── Singleton ELK instance (dùng chung với elkLayout.ts là an toàn) ──────
const elk = new ELK();

// ─── ELK Config cho Mindmap Horizontal Tree ───────────────────────────────
const MINDMAP_ELK_CONFIG = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": "15",
  "elk.layered.spacing.nodeNodeBetweenLayers": "70",
  "elk.alignment": "CENTER",
};

// ─── Kích thước node ────────────────────────────────────────────────────────
const NODE_W = 160;
const NODE_H = 44;

// ─── Kiểm tra một node có thuộc mindmap graph không ──────────────────────
const isMindmapNode = (n: Node) =>
  n.type === "mindmapNode" || n.type === "mindmap";

// ─────────────────────────────────────────────────────────────────────────────
// Hook chính
// ─────────────────────────────────────────────────────────────────────────────
export const useMindmapLayout = (nodes: Node[], edges: Edge[]) => {
  const { setNodes, setEdges, fitView } = useReactFlow();

  // Mutex: tránh gọi ELK chồng chéo
  const layoutRunning = useRef(false);

  // Lưu snapshot mới nhất để dùng trong effect mà không cần dependency
  const nodesRef = useRef<Node[]>(nodes);
  const edgesRef = useRef<Edge[]>(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // ─── ELK Layout ───────────────────────────────────────────────────────
  const performLayout = useCallback(
    async (visibleNodes: Node[], visibleEdges: Edge[]) => {
      if (visibleNodes.length === 0) return;

      const graph = {
        id: "root",
        layoutOptions: MINDMAP_ELK_CONFIG,
        children: visibleNodes.map((n) => ({
          id: n.id,
          width: NODE_W,
          height: NODE_H,
        })),
        edges: visibleEdges.map((e) => ({
          id: e.id,
          sources: [e.source],
          targets: [e.target],
        })),
      };

      try {
        const result = await elk.layout(graph as any);

        const posMap: Record<string, { x: number; y: number }> = {};
        result.children?.forEach((n) => {
          if (n.x !== undefined && n.y !== undefined) {
            posMap[n.id] = { x: Math.round(n.x), y: Math.round(n.y) };
          }
        });

        // Áp dụng tọa độ — bảo toàn TOÀN BỘ node (spread first)
        setNodes((nds) =>
          nds.map((node) => {
            if (!posMap[node.id]) return node;
            return {
              ...node,
              position: posMap[node.id],
              style: {
                ...node.style,
                transition: "transform 0.4s cubic-bezier(0.25,1,0.5,1), opacity 0.35s",
                opacity: 1,
              },
            };
          })
        );

        setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 60);
      } catch (err) {
        console.error("[useMindmapLayout] ELK error:", err);
      }
    },
    [setNodes, fitView]
  );

  // ─── Key để track khi nào thực sự cần chạy lại ────────────────────────
  // Chỉ track isExpanded của mindmapNodes và số lượng edges
  const expandedKey = nodes
    .filter(isMindmapNode)
    .map((n) => `${n.id}:${String(n.data?.isExpanded ?? true)}`)
    .sort() // sort để tránh thứ tự ảnh hưởng
    .join("|");

  const edgesKey = `count:${edges.length}`;

  // ─── Effect chính ──────────────────────────────────────────────────────
  useEffect(() => {
    const allNodes = nodesRef.current;
    const allEdges = edgesRef.current;

    // Chỉ xử lý khi có MindmapNode
    const mindmapNodes = allNodes.filter(isMindmapNode);
    if (mindmapNodes.length === 0) return;

    // Mutex check
    if (layoutRunning.current) return;
    layoutRunning.current = true;

    // ── 1. Xây dựng childrenMap ──────────────────────────────────────
    const childrenMap: Record<string, string[]> = {};
    allEdges.forEach((e) => {
      if (!childrenMap[e.source]) childrenMap[e.source] = [];
      childrenMap[e.source].push(e.target);
    });

    // ── 2. Tìm root (in-degree = 0 trong tập mindmapNodes) ──────────
    const mindmapIds = new Set(mindmapNodes.map((n) => n.id));
    const hasIncoming = new Set<string>();
    allEdges.forEach((e) => {
      if (mindmapIds.has(e.target)) hasIncoming.add(e.target);
    });
    const rootNodes = mindmapNodes.filter((n) => !hasIncoming.has(n.id));

    if (rootNodes.length === 0) {
      layoutRunning.current = false;
      return;
    }

    // ── 3. DFS: xác định visible/hidden ─────────────────────────────
    const visibleIds = new Set<string>();
    const hiddenIds = new Set<string>();

    const traverse = (
      nodeId: string,
      parentVisible: boolean,
      parentExpanded: boolean
    ) => {
      if (!mindmapIds.has(nodeId)) return; // chỉ xử lý mindmap nodes
      const node = allNodes.find((n) => n.id === nodeId);
      if (!node) return;

      const isVisible = parentVisible && parentExpanded;
      if (isVisible) visibleIds.add(nodeId);
      else hiddenIds.add(nodeId);

      const nodeExpanded = node.data?.isExpanded !== false;
      (childrenMap[nodeId] || []).forEach((cid) =>
        traverse(cid, isVisible, nodeExpanded)
      );
    };

    rootNodes.forEach((root) => {
      visibleIds.add(root.id);
      const rootExpanded = root.data?.isExpanded !== false;
      (childrenMap[root.id] || []).forEach((cid) =>
        traverse(cid, true, rootExpanded)
      );
    });

    // ── 4. Build nextNodes với hidden + hasChildren được sync ────────
    let hasChanges = false;

    const nextNodes = allNodes.map((node) => {
      // Bỏ qua node không thuộc mindmap
      if (!mindmapIds.has(node.id)) return node;

      const isHidden = hiddenIds.has(node.id);
      const hasChildren = (childrenMap[node.id] || []).length > 0;

      // Tránh ghi đè nếu không có gì thay đổi
      if (
        node.hidden === isHidden &&
        (node.data as any)?.hasChildren === hasChildren
      ) {
        return node;
      }

      hasChanges = true;
      return {
        ...node,
        hidden: isHidden,
        data: { ...node.data, hasChildren },
      };
    });

    const nextEdges = allEdges.map((edge) => {
      // Chỉ xử lý edge nối giữa 2 mindmap nodes
      if (!mindmapIds.has(edge.source)) return edge;

      const isHidden =
        hiddenIds.has(edge.source) || hiddenIds.has(edge.target);

      if (edge.hidden === isHidden && edge.type === "smoothstep") return edge;

      hasChanges = true;
      return {
        ...edge,
        hidden: isHidden,
        type: "smoothstep",
        animated: false,
        style: { ...edge.style, strokeWidth: 2, stroke: "#6366f1" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
      };
    });

    // ── 5. Cập nhật state và chạy ELK ────────────────────────────────
    if (hasChanges) {
      setNodes(nextNodes);
      setEdges(nextEdges);

      const visibleNodes = nextNodes.filter((n) => !n.hidden && mindmapIds.has(n.id));
      const visibleEdges = nextEdges.filter(
        (e) => !e.hidden && mindmapIds.has(e.source)
      );

      performLayout(visibleNodes, visibleEdges).finally(() => {
        layoutRunning.current = false;
      });
    } else {
      // Không có thay đổi hidden/hasChildren nhưng vẫn cần layout
      // (ví dụ: mới load trang lần đầu)
      const visibleNodes = allNodes.filter(
        (n) => !n.hidden && mindmapIds.has(n.id)
      );
      const visibleEdges = allEdges.filter(
        (e) => !e.hidden && mindmapIds.has(e.source)
      );
      performLayout(visibleNodes, visibleEdges).finally(() => {
        layoutRunning.current = false;
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedKey, edgesKey]);
};
