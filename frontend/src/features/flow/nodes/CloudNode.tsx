import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Cloud, Layers } from "lucide-react";

const CloudNode = ({ data, selected }: any) => {
  return (
    <div
      className={`relative px-5 py-4 min-w-[240px] rounded-2xl border shadow-2xl transition-all duration-300 backdrop-blur-md
        bg-gradient-to-br from-blue-500/20 to-indigo-600/20
        ${selected
          ? "border-blue-400 scale-105 shadow-blue-500/40"
          : "border-blue-400/40"}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(96,165,250,0.15) 0%, rgba(99,102,241,0.2) 100%)",
      }}
    >
      {/* Glassmorphism highlight */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)" }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-3 relative">
        <div className="p-2.5 rounded-xl bg-blue-500/30 border border-blue-400/40 backdrop-blur-sm">
          <Cloud className="w-5 h-5 text-blue-300" />
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
            <Layers className="w-3 h-3" /> VNPT Cloud
          </span>
          <p className="text-sm font-extrabold text-white leading-tight truncate drop-shadow">
            {data.label}
          </p>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <p className="text-[11px] text-blue-200/80 line-clamp-2 mb-3 relative">
          {data.description}
        </p>
      )}

      {/* Footer badge */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-blue-400/20 relative">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-[9px] text-blue-300/70 font-bold uppercase tracking-tight">
          Cloud Infrastructure
        </span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-blue-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-blue-900"
      />
    </div>
  );
};

export default memo(CloudNode);
