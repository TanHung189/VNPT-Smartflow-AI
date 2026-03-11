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

  const normalizeGraph = (data: any) => {
    const modernNodeStyle = {
      background: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(226, 232, 240, 0.8)",
      borderRadius: "16px",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
      padding: "15px 25px",
      fontSize: "13px",
      fontWeight: "600",
      color: "#0f172a",
      textAlign: "center" as const,
      minWidth: "180px",
    };

    const rawNodes = data?.nodes ?? [];
    const rawEdges = data?.edges ?? [];

    const nodesOut: Node[] = rawNodes.map((n: any, i: number) => {
      const id = n.id ?? n.key ?? n.name ?? `n${i + 1}`;
      const label =
        (n.data && n.data.label) ??
        n.label ??
        n.name ??
        n.title ??
        `Step ${i + 1}`;

      return {
        id: String(id),
        data: { label },
        position: n.position ?? { x: 0, y: 0 },
        style: modernNodeStyle, // QUAN TRỌNG: Gán style hiện đại vào đây
      };
    });

    const edgesOut: Edge[] = rawEdges
      .map((e: any, i: number) => {
        const source = e.source ?? e.from ?? e.src ?? e.sourceId ?? null;
        const target = e.target ?? e.to ?? e.dst ?? e.targetId ?? null;
        const id = e.id ?? `e${i}-${source ?? "s"}-${target ?? "t"}`;
        return {
          id: String(id),
          source: String(source ?? ""),
          target: String(target ?? ""),
        } as unknown as Edge;
      })
      .filter((ed: any) => ed.source && ed.target);

    return { nodes: nodesOut, edges: edgesOut };
  };

  const generateFlow = useCallback(
    async (text: string) => {
      if (!text) return;
      setLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/generate-flow?text=${encodeURIComponent(text)}`,
        );
        const resData = await response.json();

        console.debug("generateFlow response:", resData);
        if (resData.result === "SUCCESS") {
          // Normalize incoming data to expected node/edge shape then layout
          const normalized = normalizeGraph(resData.data);
          const { nodes: layoutedNodes, edges: layoutedEdges } =
            getLayoutedElements(normalized.nodes, normalized.edges);

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
