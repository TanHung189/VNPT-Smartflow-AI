import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Server, Shield } from "lucide-react";

const NetworkNode = ({ data, selected }: any) => {
  return (
    <div
      className={`relative px-5 py-4 min-w-[240px] rounded-2xl border-2 shadow-xl transition-all duration-300 bg-slate-900/95 backdrop-blur-sm
        ${selected ? "border-teal-400 scale-105 shadow-teal-500/30" : "border-slate-600"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30">
          <Server className="w-5 h-5 text-teal-400" />
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Hạ tầng mạng
          </span>
          <p className="text-sm font-extrabold text-white leading-tight truncate">
            {data.label}
          </p>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 pl-1">
          {data.description}
        </p>
      )}

      {/* Footer badge */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-700">
        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
          VNPT Network Layer
        </span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-3 !h-3 !bg-teal-500 !border-2 !border-slate-800"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-3 !h-3 !bg-teal-400 !border-2 !border-slate-800"
      />
    </div>
  );
};

export default memo(NetworkNode);
