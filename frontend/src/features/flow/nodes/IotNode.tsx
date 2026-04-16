import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Cpu, Radio } from "lucide-react";

const IotNode = ({ data, selected }: any) => {
  return (
    <div
      className={`relative px-5 py-4 min-w-[240px] rounded-2xl border-2 shadow-xl transition-all duration-300 bg-slate-950/95
        ${selected ? "border-cyan-400 scale-105 shadow-cyan-500/30" : "border-cyan-700/60"}`}
    >
      {/* Animated radio pulse ring */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping opacity-60" />
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-500" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
          <Cpu className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <Radio className="w-3 h-3" /> Smart City / IoT
          </span>
          <p className="text-sm font-extrabold text-white leading-tight truncate">
            {data.label}
          </p>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <p className="text-[11px] text-cyan-100/60 line-clamp-2 mb-3">
          {data.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-cyan-900">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
          VNPT Smart City IOC
        </span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-900"
      />
    </div>
  );
};

export default memo(IotNode);
