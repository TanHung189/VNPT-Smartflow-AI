import React, { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { StickyNote } from "lucide-react";

const StickyNode = ({ data, selected, id }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(data.label || "Ghi chú...");

  const colors = [
    { bg: "#FEF9C3", border: "#FDE047", text: "#713F12" }, // Yellow (default)
    { bg: "#DCFCE7", border: "#4ADE80", text: "#14532D" }, // Green
    { bg: "#DBEAFE", border: "#60A5FA", text: "#1E3A5F" }, // Blue
    { bg: "#FCE7F3", border: "#F472B6", text: "#831843" }, // Pink
  ];

  const colorIndex = data.colorIndex ?? 0;
  const color = colors[colorIndex % colors.length];

  return (
    <div
      className={`relative min-w-[180px] max-w-[240px] min-h-[120px] rounded-sm shadow-md transition-all duration-200
        ${selected ? "scale-105 shadow-lg" : "shadow-md"}`}
      style={{
        background: color.bg,
        border: `2px solid ${color.border}`,
        // Folded corner effect
        clipPath:
          "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)",
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Folded corner decoration */}
      <div
        className="absolute top-0 right-0 w-6 h-6 pointer-events-none"
        style={{
          background: `linear-gradient(225deg, ${color.border} 50%, ${color.bg} 50%)`,
          opacity: 0.6,
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
        <StickyNote className="w-3 h-3 opacity-60 shrink-0" style={{ color: color.text }} />
        <span
          className="text-[9px] font-black uppercase tracking-widest opacity-60"
          style={{ color: color.text }}
        >
          Ghi chú
        </span>
      </div>

      {/* Content */}
      <div className="px-3 pb-3">
        {isEditing ? (
          <textarea
            autoFocus
            className="w-full text-sm leading-relaxed resize-none outline-none bg-transparent font-medium"
            style={{ color: color.text, minHeight: "70px" }}
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={() => {
              setIsEditing(false);
              // Update node data via the data object
              if (data.onUpdate) data.onUpdate(id, "label", localText);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsEditing(false);
            }}
          />
        ) : (
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap cursor-text font-medium"
            style={{ color: color.text, minHeight: "70px" }}
          >
            {localText || (
              <span className="opacity-40 italic">Nhấn đúp để chỉnh sửa...</span>
            )}
          </p>
        )}
      </div>

      {/* Transparent handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-2 !h-2 !opacity-30 !bg-yellow-500 !border-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-2 !h-2 !opacity-30 !bg-yellow-500 !border-0"
      />
    </div>
  );
};

export default memo(StickyNode);
