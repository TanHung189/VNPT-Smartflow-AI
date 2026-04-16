import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ChartBar, Clock, DivideCircle, CheckCircle, Crosshair } from "lucide-react";

export type InfographicVariant = "process" | "timeline" | "swot" | "comparison" | "mindmap";

const ICONS = {
  process: <CheckCircle className="w-5 h-5 text-white" />,
  timeline: <Clock className="w-5 h-5 text-white" />,
  swot: <Crosshair className="w-5 h-5 text-white" />,
  comparison: <DivideCircle className="w-5 h-5 text-white" />,
  mindmap: <ChartBar className="w-5 h-5 text-white" />
};

const GRADIENTS = {
  process: "from-blue-500 to-cyan-400 shadow-blue-500/30",
  timeline: "from-purple-500 to-pink-500 shadow-purple-500/30",
  swot: "from-emerald-500 to-teal-400 shadow-emerald-500/30",
  comparison: "from-orange-500 to-amber-400 shadow-orange-500/30",
  mindmap: "from-rose-500 to-red-400 shadow-rose-500/30"
};

const InfographicNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as Record<string, any>;
  const variant: InfographicVariant = (nodeData.variant as InfographicVariant) || "process";
  const icon: React.ReactNode = nodeData.icon ? (nodeData.icon as React.ReactNode) : ICONS[variant];
  const gradient = GRADIENTS[variant] || GRADIENTS.process;

  return (
    <div
      className={`group relative flex flex-col w-64 rounded-2xl bg-white transition-all duration-300 ${
        selected ? "ring-2 ring-indigo-500 shadow-xl scale-[1.02]" : "shadow-lg hover:shadow-xl"
      }`}
    >
      {/* ── Đầu Node: Tiêu đề + Gradient ── */}
      <div className={`p-4 rounded-t-2xl bg-gradient-to-r ${gradient} flex items-center gap-3`}>
        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm shadow-sm">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{String(nodeData.label || "Tiêu đề mẫu")}</p>
          <p className="text-white/80 text-[10px] uppercase tracking-wider font-semibold">
            {variant}
          </p>
        </div>
      </div>

      {/* ── Thân Node: Nội dung chi tiết ── */}
      <div className="p-5 flex-1 min-h-[80px]">
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          {String(nodeData.description || "Thêm mô tả công việc, nội dung chi tiết hoặc chiến lược tại đây.")}
        </p>

        {/* ── Metadata / Badges (nếu có) ── */}
        {nodeData.tags && Array.isArray(nodeData.tags) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {nodeData.tags.map((tag: string, idx: number) => (
              <span key={idx} className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {nodeData.executor && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Phụ trách</span>
          <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
            {String(nodeData.executor)}
          </span>
        </div>
      )}

      {/* ── Connection Handles (Hiện khi hover cho trải nghiệm tinh tế) ── */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-white border-2 border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity !rounded-md"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-indigo-500 border-2 border-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity !rounded-md"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-white border-2 border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity !rounded-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-indigo-500 border-2 border-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity !rounded-md"
      />
    </div>
  );
};

export default InfographicNode;
