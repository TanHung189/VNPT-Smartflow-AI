import React, { useState } from "react";
import {
  MousePointer2,
  Hand,
  Square,
  Diamond,
  ArrowRight,
  Type,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  ChevronUp,
  PaintBucket
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomToolbarProps {
  activeMode: string;
  onModeChange?: (mode: { type: string }) => void;
  onAddNote?: () => void;
  onDeleteSelected?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSetPenColor?: (color: string) => void;
  onSetPenSize?: (size: number) => void;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  activeMode,
  onModeChange,
  onAddNote,
  onDeleteSelected,
  onUndo,
  onRedo,
  onSetPenColor,
  onSetPenSize,
  onDragStart,
}) => {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const toggleGroup = (group: string) => {
    setActiveGroup(activeGroup === group ? null : group);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-2 pointer-events-none">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-full px-3 py-2 flex items-center justify-center gap-2"
      >
        {/* Nhóm Select & Pan */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
          <ToolButton
            icon={<MousePointer2 size={18} />}
            label="Chọn object (V)"
            active={activeMode === "select"}
            onClick={() => onModeChange?.({ type: "select" })}
          />
          <ToolButton
            icon={<Hand size={18} />}
            label="Kéo viewport (H)"
            active={activeMode === "pan"}
            onClick={() => onModeChange?.({ type: "pan" })}
          />
        </div>

        {/* Nhóm Shapes (Xổ ngược lên bằng Group logic) */}
        <div className="relative border-r border-slate-200 pr-2 flex items-center">
          <button
            onClick={() => toggleGroup("shapes")}
            className={`p-2.5 rounded-full transition-all duration-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1 ${
              activeGroup === "shapes" ? "bg-slate-100" : ""
            }`}
          >
            <Square size={18} />
            <ChevronUp size={14} className={`transition-transform ${activeGroup === "shapes" ? "rotate-180" : ""}`}/>
          </button>
          
          {/* Popover Menu Xổ ngược */}
          <AnimatePresence>
            {activeGroup === "shapes" && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                onClick={() => setActiveGroup(null)}
                className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex gap-2"
              >
                <div
                  onDragStart={(e) => onDragStart(e, "taskNode")}
                  draggable
                  className="cursor-grab active:cursor-grabbing"
                >
                  <ToolButton
                    icon={<Square size={20} />}
                    label="Kéo: Bước Nghiệp vụ"
                    color="text-blue-600 hover:bg-blue-50"
                  />
                </div>
                <div
                  onDragStart={(e) => onDragStart(e, "conditionNode")}
                  draggable
                  className="cursor-grab active:cursor-grabbing"
                >
                  <ToolButton
                    icon={<Diamond size={20} />}
                    label="Kéo: Điều kiện, Rẽ nhánh"
                    color="text-amber-600 hover:bg-amber-50"
                  />
                </div>
                <ToolButton
                  icon={<Type size={20} />}
                  label="Thêm Ghi chú"
                  onClick={onAddNote}
                  color="text-emerald-600 hover:bg-emerald-50"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nhóm Lines Menu */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
          <ToolButton
            icon={<ArrowRight size={18} />}
            label="Nối Cáp / Luồng (C)"
            active={activeMode === "connect"}
            onClick={() => onModeChange?.({ type: "connect" })}
          />
        </div>

        {/* Nhóm Cọ vẽ & Tẩy */}
        <div className="relative border-r border-slate-200 pr-2 flex items-center">
          <button
            onClick={() => toggleGroup("pen")}
            className={`p-2.5 rounded-full transition-all duration-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1 ${
              activeGroup === "pen" ? "bg-slate-100" : ""
            }`}
          >
            <Eraser size={18} />
            <ChevronUp size={14} className={`transition-transform ${activeGroup === "pen" ? "rotate-180" : ""}`}/>
          </button>
          
          <AnimatePresence>
            {activeGroup === "pen" && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex flex-col gap-3 w-40"
              >
                <div className="flex items-center justify-between gap-2 px-2">
                  <ToolButton
                    icon={<Eraser size={18} />}
                    label="Dừng tẩy"
                    active={activeMode === "eraser"}
                    onClick={() => { onModeChange?.({ type: "eraser" }); setActiveGroup(null); }}
                  />
                  <div className="w-[1px] h-6 bg-slate-200" />
                  <div className="flex items-center justify-center p-2 rounded-full cursor-pointer hover:bg-slate-100 overflow-hidden relative">
                    <input
                      type="color"
                      defaultValue="#6366f1"
                      onChange={(e) => onSetPenColor && onSetPenColor(e.target.value)}
                      title="Màu cọ"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <PaintBucket size={18} className="text-slate-600" />
                  </div>
                </div>
                <div className="px-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Độ dày cọ</p>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    defaultValue={4}
                    onChange={(e) => onSetPenSize && onSetPenSize(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0066cc]"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nhóm Actions */}
        <div className="flex items-center gap-1">
          <ToolButton
            icon={<RotateCcw size={18} />}
            label="Hoàn tác (Ctrl+Z)"
            onClick={onUndo}
          />
          <ToolButton
            icon={<RotateCw size={18} />}
            label="Làm lại (Ctrl+Y)"
            onClick={onRedo}
          />
          <ToolButton
            icon={<Trash2 size={18} />}
            label="Xóa phần tử (Delete)"
            onClick={onDeleteSelected}
            color="text-red-500 hover:bg-red-50"
          />
        </div>
      </motion.div>
    </div>
  );
};

/* --- TOOLTIP BUTTON --- */
const ToolButton = ({
  icon,
  label,
  active = false,
  color = "text-slate-600 hover:bg-slate-100",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  color?: string;
  onClick?: () => void;
}) => (
  <div className="relative group flex items-center justify-center">
    <button
      onClick={onClick}
      className={`
      p-2.5 rounded-full transition-all duration-200 flex justify-center items-center relative
      ${active ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" : color}
    `}
    >
      {icon}
    </button>
    <div className="absolute bottom-[calc(100%+8px)] px-2.5 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-lg pointer-events-none scale-95 group-hover:scale-100 origin-bottom">
      {label}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);
