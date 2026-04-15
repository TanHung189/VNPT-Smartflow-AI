import React, { useState } from "react";
import {
  Square,
  Diamond,
  ArrowRight,
  MousePointer2,
  Trash2,
  Type,
  Hand,
  RotateCcw,
  RotateCw,
  Eraser,
  Download,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const Toolbar = ({
  activeMode,
  onModeChange,
  onAddNote,
  onDeleteSelected,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearStrokes,
  onSetPenColor,
  onSetPenSize,
  onExportJpg,
  onExportPng,
  onExportPdf,
  onOpenAI,
}: any) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <motion.div
      initial={{ y: "-50%", x: -20, opacity: 0 }}
      animate={{ y: "-50%", x: 0, opacity: 1 }}
      className="absolute top-1/2 left-4 z-50 flex flex-col items-center gap-1 p-1.5 bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl"
    >
      {/* Group 1: Selection Tools */}
      <div className="flex flex-col items-center gap-1 py-2 w-full border-b border-slate-200/50">
        <ToolbarButton
          icon={<MousePointer2 size={18} />}
          label="Chọn object"
          active={activeMode === "select"}
          onClick={() => onModeChange?.({ type: "select" })}
        />
        <ToolbarButton
          icon={<Hand size={18} />}
          label="Kéo viewport"
          active={activeMode === "pan"}
          onClick={() => onModeChange?.({ type: "pan" })}
        />
      </div>

      {/* Group 2: Node Types (Draggable) */}
      <div className="flex flex-col items-center gap-1 py-2 w-full border-b border-slate-200/50">
        <div
          onDragStart={(e) => onDragStart(e, "taskNode")}
          draggable
          className="cursor-grab active:cursor-grabbing w-full flex justify-center"
        >
          <ToolbarButton
            icon={<Square size={18} />}
            label="Kéo: Bước nghiệp vụ"
            color="hover:bg-blue-50 hover:text-blue-600"
          />
        </div>

        <div
          onDragStart={(e) => onDragStart(e, "conditionNode")}
          draggable
          className="cursor-grab active:cursor-grabbing w-full flex justify-center"
        >
          <ToolbarButton
            icon={<Diamond size={18} />}
            label="Kéo: Rẽ nhánh"
            color="hover:bg-amber-50 hover:text-amber-600"
          />
        </div>

        <ToolbarButton
          icon={<Type size={18} />}
          label="Ghi chú text"
          onClick={() => onAddNote && onAddNote()}
        />
      </div>

      {/* Group 3: Connection & Delete */}
      <div className="flex flex-col items-center gap-1 py-2 w-full border-b border-slate-200/50">
        <ToolbarButton
          icon={<ArrowRight size={18} />}
          label="Kết nối Nodes"
          active={activeMode === "connect"}
          onClick={() => onModeChange?.({ type: "connect" })}
        />
        <ToolbarButton
          icon={<Trash2 size={18} />}
          label="Xóa đối tượng"
          color="hover:bg-red-50 hover:text-red-500"
          onClick={() => onDeleteSelected && onDeleteSelected()}
        />
      </div>

      {/* Group 4: History & Drawing Controls */}
      <div className="flex flex-col items-center gap-1 py-2 w-full border-b border-slate-200/50">
        <ToolbarButton
          icon={<RotateCcw size={16} />}
          label="Undo"
          onClick={() => onUndo && onUndo()}
          active={false}
        />
        <ToolbarButton
          icon={<RotateCw size={16} />}
          label="Redo"
          onClick={() => onRedo && onRedo()}
          active={false}
        />

        <ToolbarButton
          icon={<Eraser size={16} />}
          label="Cọ xóa"
          active={activeMode === "eraser"}
          onClick={() => onModeChange?.({ type: "eraser" })}
        />

        <div className="flex flex-col items-center gap-2 mt-1 w-full justify-center">
          <input
            type="color"
            defaultValue="#6366f1"
            onChange={(e) => onSetPenColor && onSetPenColor(e.target.value)}
            title="Màu cọ"
            className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer rounded-full overflow-hidden"
          />
          <input
            type="range"
            min={1}
            max={24}
            defaultValue={4}
            onChange={(e) =>
              onSetPenSize && onSetPenSize(Number(e.target.value))
            }
            title="Kích thước cọ"
            className="w-10 h-1 accent-indigo-500"
          />
        </div>
      </div>

      {/* Group 5: Export Controls */}
      <div className="flex flex-col items-center gap-1 pt-2 w-full relative">
        <button
          onClick={() => setExportMenuOpen(!exportMenuOpen)}
          className="relative group p-2.5 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center w-full"
        >
          <Download size={16} />
          {/* Tooltip */}
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]">
            Tải sơ đồ
            <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
          </span>
        </button>
        {exportMenuOpen && (
          <div className="absolute left-full ml-4 top-0 bg-white border border-slate-200 shadow-2xl rounded-xl py-2 w-40 z-[100]">
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium flex items-center gap-3 text-slate-700"
              onClick={() => {
                setExportMenuOpen(false);
                onExportJpg && onExportJpg();
              }}
            >
              <ImageIcon size={14} className="text-blue-500" /> Xuất JPG
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium flex items-center gap-3 text-slate-700"
              onClick={() => {
                setExportMenuOpen(false);
                onExportPng && onExportPng();
              }}
            >
              <ImageIcon size={14} className="text-emerald-500" /> Xuất PNG
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium flex items-center gap-3 text-slate-700"
              onClick={() => {
                setExportMenuOpen(false);
                onExportPdf && onExportPdf();
              }}
            >
              <FileText size={14} className="text-red-500" /> Xuất PDF
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ToolbarButton = ({
  icon,
  label,
  active = false,
  color = "hover:bg-slate-100 text-slate-700",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  color?: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`
    relative group p-2.5 rounded-xl transition-all duration-200 w-full flex justify-center
    ${active ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" : `text-slate-500 ${color}`}
  `}
  >
    {icon}
    <span className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100] shadow-lg">
      {label}
      <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
    </span>
  </button>
);

export default Toolbar;
