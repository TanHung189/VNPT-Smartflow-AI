import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Play, CheckCircle2, AlertCircle, Settings } from "lucide-react";

const SmartNode = ({ data, selected }: any) => {
  const getStyle = () => {
    switch (data.type) {
      case "start":
        return {
          bg: "bg-emerald-500",
          light: "bg-emerald-50",
          text: "text-emerald-700",
          icon: <Play className="w-5 h-5 text-white" />,
        };
      case "decision":
        return {
          bg: "bg-amber-500",
          light: "bg-amber-50",
          text: "text-amber-700",
          icon: <AlertCircle className="w-5 h-5 text-white" />,
        };
      case "end":
        return {
          bg: "bg-rose-500",
          light: "bg-rose-50",
          text: "text-rose-700",
          icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        };
      default:
        return {
          bg: "bg-indigo-600",
          light: "bg-indigo-50",
          text: "text-indigo-700",
          icon: <Settings className="w-5 h-5 text-white" />,
        };
    }
  };

  const s = getStyle();

  return (
    <div
      className={`relative px-6 py-5 min-w-[240px] bg-white/90 backdrop-blur-md rounded-[24px] border-2 shadow-2xl transition-all duration-300 ${selected ? "border-indigo-500 scale-105 shadow-indigo-200" : "border-slate-100"}`}
    >
      <div className="flex items-center gap-4 mb-3">
        <div className={`p-3 rounded-2xl shadow-lg ${s.bg}`}>{s.icon}</div>
        <div className="flex flex-col">
          <span
            className={`text-[10px] font-black uppercase tracking-[0.2em] ${s.text}`}
          >
            {data.type}
          </span>
          <p className="text-sm font-extrabold text-slate-800 leading-tight">
            {data.label}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-50">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-[9px] text-slate-400 font-bold uppercase">
          VNPT SmartFlow AI
        </span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-4 !h-4 !bg-white !border-2 !border-slate-300"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-4 !h-4 !bg-indigo-500 !border-2 !border-white shadow-md"
      />
    </div>
  );
};

export default memo(SmartNode);
