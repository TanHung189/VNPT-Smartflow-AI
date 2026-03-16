import React from "react";
import {
  Square,
  Diamond,
  ArrowRight,
  MousePointer2,
  Trash2,
  Type,
  Hand,
} from "lucide-react";
import { motion } from "framer-motion";

const Toolbar = () => {
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
        <ToolbarButton icon={<MousePointer2 size={18} />} label="Chọn" active />
        <ToolbarButton icon={<Hand size={18} />} label="Kéo view" />
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

        <ToolbarButton icon={<Type size={18} />} label="Ghi chú" />
      </div>

      {/* Group 3: Connection & Action */}
      <div className="flex items-center gap-1 px-2">
        <ToolbarButton icon={<ArrowRight size={18} />} label="Kết nối" />
        <ToolbarButton
          icon={<Trash2 size={18} />}
          label="Xóa"
          color="hover:bg-red-50 hover:text-red-600"
        />
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
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  color?: string;
}) => (
  <button
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
