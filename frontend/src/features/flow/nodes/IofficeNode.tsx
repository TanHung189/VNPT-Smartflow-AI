import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { FileText, CheckCircle } from "lucide-react";

const IofficeNode = ({ data, selected }: any) => {
  return (
    <div
      className={`relative px-5 py-4 min-w-[240px] rounded-2xl border-2 shadow-xl transition-all duration-300 bg-white
        ${selected ? "border-emerald-500 scale-105 shadow-emerald-400/30" : "border-emerald-200"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-200">
          <FileText className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3" /> iOffice Workflow
          </span>
          <p className="text-sm font-extrabold text-slate-800 leading-tight truncate">
            {data.label}
          </p>
        </div>
      </div>

      {/* Executor badge */}
      {data.executor && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
            👤 {data.executor}
          </span>
        </div>
      )}

      {/* Description */}
      {data.description && (
        <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
          {data.description}
        </p>
      )}

      {/* Footer badge */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-emerald-50">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
          VNPT iOffice
        </span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-3 !h-3 !bg-white !border-2 !border-emerald-400"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(IofficeNode);
