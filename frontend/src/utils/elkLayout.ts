/**
 * elkLayout.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Async auto-layout engine powered by ELK.js (Eclipse Layout Kernel).
 * Replaces the old synchronous Dagre-based `calculateLayout` helper.
 *
 * Key advantages over Dagre:
 *  • ORTHOGONAL edge routing → edges never cross through node bodies.
 *  • Hierarchical "layered" algorithm → cleaner enterprise diagrams.
 *  • Fully async → compatible with React's concurrent rendering model.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import ELK, { ElkNode, ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { Node, Edge } from "@xyflow/react";

// ─── Shared ELK instance (singleton – avoids repeated WASM init cost) ────────
const elk = new ELK();

// ─── Layout direction lookup ──────────────────────────────────────────────────
export type LayoutDirection = "TB" | "LR";

const DIRECTION_MAP: Record<string, LayoutDirection> = {
  "org-chart": "TB",
  org: "TB",
  layered: "TB",
  layer: "TB",
  uml: "TB",
  "uml-class": "TB",
  process: "LR",
  ioffice: "LR",
  "quy-trinh": "LR",
  workflow: "LR",
  mindmap: "TB",
  network: "TB",
  infrastructure: "TB",
  cloud: "TB",
  iot: "LR",
  "smart-city": "LR",
};

const resolveDirection = (diagramType: string): LayoutDirection =>
  DIRECTION_MAP[diagramType.toLowerCase()] ?? "TB";

// ─── Node size constants ──────────────────────────────────────────────────────
const NODE_W_LR = 260;
const NODE_H_LR = 130;
const NODE_W_TB = 300;
const NODE_H_TB = 170;

// ─── Edge type per diagram structure ─────────────────────────────────────────
const resolveEdgeType = (diagramType: string): string => {
  const t = diagramType.toLowerCase();
  if (t === "mindmap") return "bezier";
  if (t === "org-chart" || t === "org") return "smoothstep";
  return "default";
};

// ─────────────────────────────────────────────────────────────────────────────
//  MINDMAP  — bidirectional spread (left + right branches)
//  Uses two independent ELK runs and merges their coordinates.
// ─────────────────────────────────────────────────────────────────────────────
const runElkOnce = async (
  elkNodes: ElkNode[],
  elkEdges: ElkExtendedEdge[],
  direction: "RIGHT" | "LEFT",
): Promise<ElkNode> => {
  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": "60",
      "elk.layered.spacing.nodeNodeBetweenLayers": "150",
    },
    children: elkNodes,
    edges: elkEdges,
  };
  return elk.layout(graph);
};
// dành cho mindmap
const mindmapLayout = async (
  nodes: Node[],
  edges: Edge[],
): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  if (nodes.length === 0) return { nodes, edges };

  // ── Find root (node with in-degree 0) ──
  const inDegrees: Record<string, number> = {};
  nodes.forEach((n) => (inDegrees[n.id] = 0));
  edges.forEach((e) => {
    if (inDegrees[e.target] !== undefined) inDegrees[e.target]++;
  });
  const root = nodes.find((n) => inDegrees[n.id] === 0) ?? nodes[0];

  // ── Split root children into Right / Left halves ──
  const rootEdges = edges.filter((e) => e.source === root.id);
  const rightChildSet = new Set<string>();
  const leftChildSet = new Set<string>();
  rootEdges.forEach((e, i) => {
    if (i % 2 === 0) rightChildSet.add(e.target);
    else leftChildSet.add(e.target);
  });

  // BFS to collect all descendants of a starting set
  const bfsDescendants = (seeds: Set<string>): Set<string> => {
    const result = new Set<string>(seeds);
    const queue = Array.from(seeds);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      edges
        .filter((e) => e.source === curr)
        .forEach((e) => {
          if (!result.has(e.target)) {
            result.add(e.target);
            queue.push(e.target);
          }
        });
    }
    return result;
  };

  const rightSet = bfsDescendants(rightChildSet);
  const leftSet = bfsDescendants(leftChildSet);

  const nodeW = NODE_W_LR;
  const nodeH = NODE_H_LR;

  // ── Build ELK inputs for each half (include root in both) ──
  const buildHalfInputs = (sideSet: Set<string>) => {
    const allIds = new Set([root.id, ...Array.from(sideSet)]);
    const elkNodes: ElkNode[] = nodes
      .filter((n) => allIds.has(n.id))
      .map((n) => ({ id: n.id, width: nodeW, height: nodeH }));
    const elkEdges: ElkExtendedEdge[] = edges
      .filter(
        (e) =>
          (e.source === root.id && sideSet.has(e.target)) ||
          (sideSet.has(e.source) && sideSet.has(e.target)),
      )
      .map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] }));
    return { elkNodes, elkEdges };
  };

  const rightInputs = buildHalfInputs(rightSet);
  const leftInputs = buildHalfInputs(leftSet);

  const [gRight, gLeft] = await Promise.all([
    runElkOnce(rightInputs.elkNodes, rightInputs.elkEdges, "RIGHT"),
    runElkOnce(leftInputs.elkNodes, leftInputs.elkEdges, "LEFT"),
  ]);

  // Extract root position from each half layout to use as origin offset
  const rootRight = gRight.children?.find((n) => n.id === root.id);
  const rootLeft = gLeft.children?.find((n) => n.id === root.id);
  const rootRightX = rootRight?.x ?? 0;
  const rootRightY = rootRight?.y ?? 0;
  const rootLeftX = rootLeft?.x ?? 0;
  const rootLeftY = rootLeft?.y ?? 0;

  // Build position lookup from ELK outputs
  const posRight: Record<string, { x: number; y: number }> = {};
  const posLeft: Record<string, { x: number; y: number }> = {};
  gRight.children?.forEach(
    (n) => (posRight[n.id] = { x: n.x ?? 0, y: n.y ?? 0 }),
  );
  gLeft.children?.forEach(
    (n) => (posLeft[n.id] = { x: n.x ?? 0, y: n.y ?? 0 }),
  );

  const outNodes: Node[] = nodes.map((node) => {
    let x = 0;
    let y = 0;
    let targetPosition = "left";
    let sourcePosition = "right";

    if (node.id === root.id) {
      x = 0;
      y = 0;
    } else if (rightSet.has(node.id) && posRight[node.id]) {
      x = posRight[node.id].x - rootRightX;
      y = posRight[node.id].y - rootRightY;
      targetPosition = "left";
      sourcePosition = "right";
    } else if (leftSet.has(node.id) && posLeft[node.id]) {
      x = posLeft[node.id].x - rootLeftX;
      y = posLeft[node.id].y - rootLeftY;
      targetPosition = "right";
      sourcePosition = "left";
    }

    return {
      ...node,
      targetPosition: targetPosition as any,
      sourcePosition: sourcePosition as any,
      data: { ...node.data, isRoot: node.id === root.id },
      style: {
        ...node.style,
        transition: "transform 0.5s ease-in-out, opacity 0.5s ease-in-out",
      },
      position: { x: Math.round(x), y: Math.round(y) },
    };
  });

  const outEdges = edges.map((e) => ({ ...e, type: "bezier" }));
  return { nodes: outNodes, edges: outEdges };
};

// ─────────────────────────────────────────────────────────────────────────────
//  STANDARD LAYOUT  — ELK layered algorithm (TB or LR)
// ─────────────────────────────────────────────────────────────────────────────
const standardLayout = async (
  nodes: Node[],
  edges: Edge[],
  diagramType: string,
): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  const direction = resolveDirection(diagramType);
  const elkDir = direction === "LR" ? "RIGHT" : "DOWN";
  const isOrgChart = diagramType === "org-chart" || diagramType === "org";
  const edgeType = resolveEdgeType(diagramType);

  const nodeW = direction === "LR" ? NODE_W_LR : NODE_W_TB;
  const nodeH = direction === "LR" ? NODE_H_LR : NODE_H_TB;

  const nodeSep = isOrgChart ? "150" : direction === "LR" ? "80" : "100";
  const layerSep = isOrgChart ? "150" : direction === "LR" ? "150" : "200";

  const elkGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": elkDir,
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": nodeSep,
      "elk.layered.spacing.nodeNodeBetweenLayers": layerSep,
    },
    children: nodes.map((n) => ({ id: n.id, width: nodeW, height: nodeH })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const result = await elk.layout(elkGraph);

  const posMap: Record<string, { x: number; y: number }> = {};
  result.children?.forEach(
    (n) => (posMap[n.id] = { x: n.x ?? 0, y: n.y ?? 0 }),
  );

  const outNodes: Node[] = nodes.map((node) => {
    const pos = posMap[node.id];
    if (!pos) return node;
    return {
      ...node,
      targetPosition: (direction === "LR" ? "left" : "top") as any,
      sourcePosition: (direction === "LR" ? "right" : "bottom") as any,
      style: {
        ...node.style,
        transition: "transform 0.5s ease-in-out, opacity 0.5s ease-in-out",
      },
      position: { x: Math.round(pos.x), y: Math.round(pos.y) },
    };
  });

  const outEdges: Edge[] = edges.map((e) => ({ ...e, type: edgeType }));
  return { nodes: outNodes, edges: outEdges };
};

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
/**
 * getElkLayoutedElements
 *
 * Async replacement for the old synchronous `calculateLayout` (Dagre).
 * Automatically selects the right algorithm based on `diagramType`.
 *
 * @param nodes        React Flow nodes
 * @param edges        React Flow edges
 * @param diagramType  the_loai / diagram category key (e.g. "process", "mindmap")
 */
export const getElkLayoutedElements = async (
  nodes: Node[],
  edges: Edge[],
  diagramType: string = "logic",
): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  if (nodes.length === 0) return { nodes, edges };

  const t = diagramType.toLowerCase();
  const isMindMap = t === "mindmap";

  if (isMindMap) {
    return mindmapLayout(nodes, edges);
  }
  return standardLayout(nodes, edges, t);
};
