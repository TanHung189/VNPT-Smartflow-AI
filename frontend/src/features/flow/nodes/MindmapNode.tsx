import React, { memo } from "react";
import { Handle, Position, useReactFlow, NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";

// ─── Interface dữ liệu MindmapNode ────────────────────────────────────────
export interface MindmapNodeData {
  label: string;
  isRoot?: boolean;        // Root node → ẩn target handle bên trái
  hasChildren?: boolean;   // Có node con → hiển thị nút Toggle
  isExpanded?: boolean;    // Trạng thái mở/đóng nhánh con
  level?: "root" | "branch" | "leaf"; // Cấp độ để style khác nhau
}

// ─── Màu sắc theo cấp độ ──────────────────────────────────────────────────
const LEVEL_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  root: {
    bg: "bg-gradient-to-br from-blue-600 to-indigo-700",
    border: "border-blue-400",
    text: "text-white",
  },
  branch: {
    bg: "bg-slate-800",
    border: "border-slate-600",
    text: "text-slate-100",
  },
  leaf: {
    bg: "bg-slate-700/80",
    border: "border-slate-600/60",
    text: "text-slate-200",
  },
};

const MindmapNodeComponent = ({ id, data, selected }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const d = data as unknown as MindmapNodeData;

  // Xác định style theo level
  const level = d.level ?? (d.isRoot ? "root" : "branch");
  const ls = LEVEL_STYLES[level] ?? LEVEL_STYLES.branch;

  // ── Xử lý Toggle (Mở/Đóng nhánh con) ──────────────────────────────────
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Quan trọng: ngăn React Flow activate selection

    const currentExpanded = d.isExpanded !== false; // default: true
    const willExpand = !currentExpanded;

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          // Spread toàn bộ node → chỉ thay đổi isExpanded
          return { ...n, data: { ...n.data, isExpanded: willExpand } };
        }
        return n;
      })
    );
  };

  return (
    <div
      className={`
        relative px-4 py-2.5 rounded-xl border-2 shadow-lg
        transition-all duration-300 cursor-default select-none
        ${ls.bg} ${ls.border} ${ls.text}
        ${selected ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900 scale-[1.03]" : "hover:brightness-110"}
        ${d.isRoot ? "min-w-[140px] text-sm font-bold" : "min-w-[120px] text-xs font-medium"}
      `}
    >
      {/* ── Target Handle (Bên Trái) — ẩn ở Root Node ─────────────── */}
      {!d.isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !bg-slate-400 !border-0"
          style={{ left: -4 }}
        />
      )}

      {/* ── Nhãn Node ──────────────────────────────────────────────── */}
      <span className="block leading-tight max-w-[180px] break-words">
        {d.label}
      </span>

      {/* ── Source Handle (Bên Phải) — luôn ẩn tàng hình ────────────── */}
      <Handle
        type="source"
        position={Position.Right}
        className="!opacity-0 !w-1 !h-1"
        style={{ right: -2 }}
      />

      {/* ── Nút Toggle (Chỉ hiện khi có node con) ───────────────────── */}
      {d.hasChildren && (
        <button
          onClick={handleToggle}
          title={d.isExpanded !== false ? "Thu gọn nhánh" : "Mở rộng nhánh"}
          className={`
            absolute -right-3.5 top-1/2 -translate-y-1/2
            w-7 h-7 rounded-full border-2 border-slate-900
            flex items-center justify-center
            transition-all duration-200 z-20 shadow-md
            ${d.isExpanded !== false
              ? "bg-indigo-500 hover:bg-indigo-400"
              : "bg-slate-600 hover:bg-slate-500"
            }
          `}
        >
          {d.isExpanded !== false ? (
            <ChevronDown size={13} strokeWidth={3} className="text-white" />
          ) : (
            <ChevronRight size={13} strokeWidth={3} className="text-white" />
          )}
        </button>
      )}

      {/* ── Badge cấp độ (chỉ hiện ở root) ────────────────────────── */}
      {d.isRoot && (
        <span className="absolute -top-2 -left-1 text-[9px] font-black uppercase tracking-widest bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full shadow">
          ROOT
        </span>
      )}
    </div>
  );
};

export default memo(MindmapNodeComponent);
