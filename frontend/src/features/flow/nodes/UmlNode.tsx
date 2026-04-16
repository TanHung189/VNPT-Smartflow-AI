import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";

const UmlNode = ({ data, selected }: any) => {
  const isUseCase = data.type === "usecase" || data.shape === "ellipse";
  const isActor = data.type === "actor";

  if (isActor) {
    return (
      <div className="flex flex-col items-center gap-1 min-w-[80px]">
        {/* Stick figure head */}
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white" />
        {/* Body */}
        <div className="w-[2px] h-6 bg-slate-900" />
        {/* Arms */}
        <div className="w-12 h-[2px] bg-slate-900 -mt-5" />
        {/* Legs */}
        <div className="flex gap-2 mt-1">
          <div className="w-[2px] h-5 bg-slate-900 -rotate-12 origin-top" />
          <div className="w-[2px] h-5 bg-slate-900 rotate-12 origin-top" />
        </div>
        <span className="text-xs font-bold text-slate-800 mt-1 text-center leading-tight max-w-[100px] font-['Inter']">
          {data.label}
        </span>
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
        <Handle type="target" position={Position.Top} className="opacity-0" />
      </div>
    );
  }

  if (isUseCase) {
    return (
      <div className="relative">
        <div
          className={`px-6 py-4 min-w-[160px] max-w-[220px] border-2 bg-white transition-all duration-300
            ${selected ? "border-slate-900 shadow-lg scale-105" : "border-slate-800"}`}
          style={{ borderRadius: "50%", fontFamily: "Inter, sans-serif" }}
        >
          <p className="text-sm font-semibold text-slate-900 text-center leading-snug">
            {data.label}
          </p>
          {data.description && (
            <p className="text-[10px] text-slate-500 text-center mt-1 line-clamp-2">
              {data.description}
            </p>
          )}
        </div>
        <Handle
          type="target"
          position={Position.Top}
          style={{ left: "50%", transform: "translateX(-50%)" }}
          className="!w-2.5 !h-2.5 !bg-slate-900 !border-0"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ left: "50%", transform: "translateX(-50%)" }}
          className="!w-2.5 !h-2.5 !bg-slate-900 !border-0"
        />
      </div>
    );
  }

  // Default UML box (class / activity)
  return (
    <div
      className={`min-w-[200px] bg-white border-2 transition-all duration-300 shadow-md
        ${selected ? "border-slate-900 scale-105 shadow-slate-400/30" : "border-slate-800"}`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Class name header */}
      <div className="px-4 py-2 border-b-2 border-slate-800 bg-slate-50 text-center">
        <p className="text-sm font-bold text-slate-900 tracking-wide">
          {data.label}
        </p>
        {data.stereotype && (
          <p className="text-[9px] text-slate-500">«{data.stereotype}»</p>
        )}
      </div>

      {/* Attributes or description */}
      <div className="px-4 py-2.5 border-b border-slate-200 min-h-[28px]">
        {data.description ? (
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {data.description}
          </p>
        ) : (
          <p className="text-[11px] text-slate-300 italic">− attributes</p>
        )}
      </div>

      {/* Methods area */}
      <div className="px-4 py-2 min-h-[24px]">
        {data.methods ? (
          <p className="text-[11px] text-slate-600">{data.methods}</p>
        ) : (
          <p className="text-[11px] text-slate-300 italic">+ methods()</p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-2.5 !h-2.5 !bg-slate-800 !border-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ left: "50%", transform: "translateX(-50%)" }}
        className="!w-2.5 !h-2.5 !bg-slate-800 !border-0"
      />
    </div>
  );
};

export default memo(UmlNode);
