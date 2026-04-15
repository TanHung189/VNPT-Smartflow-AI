import React from "react";
import { Clock, Save, Image as ImageIcon, ChevronLeft } from "lucide-react";
import { HistoryDrawer } from "../../features/chat/HistoryDrawer";
import { useNavigate } from "react-router-dom";

interface TopHeaderProps {
  lastSavedTime: string;
  isGenerating: boolean;
  handleSave: () => void;
  handleExportPNG: () => void;
  diagramTitle: string;
  onRename: (title: string) => void;
  onLoadDiagram: (id: string, flowData?: any) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  lastSavedTime,
  isGenerating,
  handleSave,
  handleExportPNG,
  diagramTitle,
  onRename,
  onLoadDiagram,
}) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full h-14 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-[60] flex items-center justify-between px-4 transition-colors">
      {/* ─── CỤM TRÁI: Menu, Go Back & Title ─── */}
      <div className="flex items-center gap-3">
        {/* Lịch sử Sơ đồ (History Drawer) */}
        <HistoryDrawer onLoadDiagram={onLoadDiagram} />

        {/* Nút quay lại Dashboard */}
        <button
          onClick={() => navigate("/dashboard")}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[#0066cc] transition-colors"
          title="Về Dashboard"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Inline rename — cập nhật ngay lập tức */}
        <input
          type="text"
          value={diagramTitle}
          onChange={(e) => onRename(e.target.value)}
          className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-lg tracking-tight bg-transparent border-2 border-transparent hover:border-slate-200 focus:border-[#0066cc] focus:bg-white rounded-lg px-3 py-1 outline-none transition-all w-48 sm:w-64 md:w-80 truncate"
          placeholder="Nhập tên luồng..."
        />
      </div>

      {/* ─── CỤM PHẢI: Sync Stats & Actions ─── */}
      <div className="flex items-center gap-4">
        {/* Sync Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-medium tracking-wide">{lastSavedTime}</span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isGenerating ? "bg-amber-500 animate-spin" : "bg-emerald-500 animate-pulse"
            }`}
          />
          <span className="hidden sm:inline-block text-xs font-bold text-slate-600 uppercase tracking-tighter">
            {isGenerating ? "AI Processing..." : "System Ready"}
          </span>
        </div>

        <div className="hidden md:block h-6 w-[1px] bg-slate-200 mx-1" />

        {/* Export Group */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            title="Lưu Data lên Server"
            className="bg-[#0066cc] hover:bg-blue-700 active:scale-95 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> <span className="hidden sm:inline">Lưu</span>
          </button>
          
          <button
            onClick={handleExportPNG}
            title="Xuất mốc ảnh PNG"
            className="border border-slate-200 hover:border-slate-300 active:scale-95 bg-white text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4 text-[#0066cc]" /> <span className="hidden sm:inline">Xuất PNG</span>
          </button>
        </div>
      </div>
    </header>
  );
};
