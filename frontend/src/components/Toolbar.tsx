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
  ChevronDown,
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
}: any) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  // Hàm xử lý kéo thả Node
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <motion.div
      initial={{ y: -20, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      className="absolute top-6 left-1/2 z-50 flex items-center gap-1 p-1.5 bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-2xl"
    >
      {/* Group 1: Selection Tools */}
      <div className="flex items-center gap-1 px-2 border-r border-slate-200/50">
        <ToolbarButton
          icon={<MousePointer2 size={18} />}
          label="Chọn"
          active={activeMode === "select"}
          onClick={() => onModeChange?.({ type: "select" })}
        />
        <ToolbarButton
          icon={<Hand size={18} />}
          label="Kéo view"
          active={activeMode === "pan"}
          onClick={() => onModeChange?.({ type: "pan" })}
        />
      </div>

      {/* Group 2: Node Types (Draggable) */}
      <div className="flex items-center gap-1 px-2 border-r border-slate-200/50">
        <div
          onDragStart={(e) => onDragStart(e, "taskNode")}
          draggable
          className="cursor-grab active:cursor-grabbing"
        >
          <ToolbarButton
            icon={<Square size={18} />}
            label="Bước nghiệp vụ"
            color="hover:bg-blue-50 hover:text-blue-600"
          />
        </div>

        <div
          onDragStart={(e) => onDragStart(e, "conditionNode")}
          draggable
          className="cursor-grab active:cursor-grabbing"
        >
          <ToolbarButton
            icon={<Diamond size={18} />}
            label="Điều kiện Rẽ nhánh"
            color="hover:bg-amber-50 hover:text-amber-600"
          />
        </div>

        <ToolbarButton
          icon={<Type size={18} />}
          label="Ghi chú"
          onClick={() => onAddNote && onAddNote()}
        />
      </div>

      {/* Group 3: Connection & Action */}
      <div className="flex items-center gap-1 px-2">
        <ToolbarButton
          icon={<ArrowRight size={18} />}
          label="Kết nối"
          active={activeMode === "connect"}
          onClick={() => onModeChange?.({ type: "connect" })}
        />
        <ToolbarButton
          icon={<Trash2 size={18} />}
          label="Xóa"
          color="hover:bg-red-50 hover:text-red-600"
          onClick={() => onDeleteSelected && onDeleteSelected()}
        />
      </div>
      {/* Group 4: History & Drawing Controls */}
      <div className="flex items-center gap-1 px-2 border-l border-slate-200/50">
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

        <div className="flex items-center gap-1 px-2">
          <ToolbarButton
            icon={<Eraser size={16} />}
            label="Cọ xóa"
            active={activeMode === "eraser"}
            onClick={() => onModeChange?.({ type: "eraser" })}
          />
          <div className="flex items-center gap-2 px-2">
            <input
              type="color"
              defaultValue="#6366f1"
              onChange={(e) => onSetPenColor && onSetPenColor(e.target.value)}
              title="Màu cọ"
              className="w-8 h-8 p-0 border-0 bg-transparent"
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
            />
          </div>

          <ToolbarButton
            icon={<Trash2 size={16} />}
            label="Xóa cọ"
            color="hover:bg-red-50 hover:text-red-600"
            onClick={() => onClearStrokes && onClearStrokes()}
          />
        </div>
      </div>

      {/* Group 5: Export Controls */}
      <div className="flex items-center gap-1 px-2 border-l border-slate-200/50 relative">
        <button
          onClick={() => setExportMenuOpen(!exportMenuOpen)}
          className="relative group p-2.5 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-100 flex items-center gap-1"
        >
          <Download size={16} />
          <span className="text-xs font-medium">Xuất tệp</span>
          <ChevronDown size={14} />
        </button>
        {exportMenuOpen && (
          <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 shadow-xl rounded-xl py-2 w-40 z-[100]">
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium flex items-center gap-2 text-slate-700"
              onClick={() => { setExportMenuOpen(false); onExportJpg && onExportJpg(); }}
            >
              <ImageIcon size={16} className="text-blue-500" /> Xuất JPG
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium flex items-center gap-2 text-slate-700"
              onClick={() => { setExportMenuOpen(false); onExportPng && onExportPng(); }}
            >
              <ImageIcon size={16} className="text-emerald-500" /> Xuất PNG
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium flex items-center gap-2 text-slate-700"
              onClick={() => { setExportMenuOpen(false); onExportPdf && onExportPdf(); }}
            >
              <FileText size={16} className="text-red-500" /> Xuất PDF
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Component con cho từng nút trên Toolbar
const ToolbarButton = ({
  icon,
  label,
  active = false,
  color = "hover:bg-slate-100 text-slate-600",
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
    relative group p-2.5 rounded-xl transition-all duration-200
    ${active ? "bg-slate-900 text-white shadow-lg" : `text-slate-500 ${color}`}
  `}
  >
    {icon}
    {/* Tooltip */}
    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      {label}
    </span>
  </button>
);

export default Toolbar;
