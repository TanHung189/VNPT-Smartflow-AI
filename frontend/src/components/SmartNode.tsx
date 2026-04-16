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
      className={`relative px-6 py-5 min-w-[260px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-[28px] border-2 shadow-2xl transition-all duration-300 ${selected ? "border-indigo-500 shadow-indigo-500/20 scale-105" : "border-slate-100 dark:border-slate-800"}`}
    >
      <div className="flex items-start gap-4 mb-3">
        <div className={`p-3 rounded-2xl shadow-lg shrink-0 ${s.bg}`}>
          {s.icon}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span
            className={`text-[9px] font-black uppercase tracking-[0.15em] mb-0.5 ${s.text} dark:opacity-80`}
          >
            {data.type} • {data.executor || "Chưa gán"}
          </span>
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
            {data.label}
          </p>
        </div>
      </div>

      {/* Hiển thị một dòng mô tả ngắn dưới Node */}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-3 italic">
        {data.description || "Nhấn để xem chi tiết..."}
      </p>

      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-50 dark:border-slate-800">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
          VNPT SmartFlow AI
        </span>
      </div>

      {/* Các Handle giữ nguyên */}
      {/* Handle Target (Top) — style ép căn giữa tuyệt đối, tránh mũi tên gãy hình chữ Z */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-3 !h-3 !bg-white !border-2 !border-slate-200"
      />
      {/* Handle Source (Bottom) — style ép căn giữa tuyệt đối */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(SmartNode);
