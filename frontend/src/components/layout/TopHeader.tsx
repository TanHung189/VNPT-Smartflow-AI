import React, { useState, useRef } from "react";
import { Clock, Save, ChevronLeft, Download } from "lucide-react";
import { HistoryDrawer } from "../../features/chat/HistoryDrawer";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface TopHeaderProps {
  lastSavedTime: string;
  isGenerating: boolean;
  handleSave: () => void;
  handleExportPNG: () => void;
  handleExportPDF?: () => void;
  handleExportSVG?: () => void;
  diagramTitle?: string;
  diagramType?: string;
  onRename?: (newTitle: string) => void;
  onLoadDiagram?: (id: string, flowData?: any) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  lastSavedTime,
  isGenerating,
  handleSave,
  handleExportPNG,
  handleExportPDF,
  handleExportSVG,
  diagramTitle = "VNPT SmartFlow Workspace",
  diagramType = "process",
  onRename,
  onLoadDiagram,
}) => {
  const navigate = useNavigate();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside-click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full h-14 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-[60] flex items-center justify-between px-4 transition-colors">
      {/* ─── LEFT: Back, History & Title ─── */}
      <div className="flex items-center gap-3">
        <HistoryDrawer onLoadDiagram={onLoadDiagram || ((id) => console.log("Tải diagram", id))} />

        <button
          onClick={() => navigate("/dashboard")}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[#0066cc] transition-colors"
          title="Về Dashboard (ESC)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Editable title (Miro style) */}
        <input
          type="text"
          value={diagramTitle}
          onChange={(e) => onRename?.(e.target.value)}
          className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-lg tracking-tight bg-transparent border-2 border-transparent hover:border-slate-200 focus:border-[#0066cc] focus:bg-white rounded-lg px-3 py-1 outline-none transition-all w-48 sm:w-64 md:w-80 truncate"
        />

        {/* Template Badge Indicator */}
        <div className="flex items-center gap-2">
          {(() => {
            const config: Record<string, { label: string; color: string }> = {
              "org-chart": { label: "Sơ đồ Tổ chức", color: "bg-orange-100 text-orange-700 border-orange-200" },
              "ioffice": { label: "Quy trình iOffice", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
              "layered": { label: "Kiến trúc Phân tầng", color: "bg-blue-100 text-blue-700 border-blue-200" },
              "mindmap": { label: "Sơ đồ Tư duy", color: "bg-amber-100 text-amber-700 border-amber-200" },
              "uml": { label: "Thiết kế UML", color: "bg-purple-100 text-purple-700 border-purple-200" },
              "process": { label: "Luồng Quy trình", color: "bg-slate-100 text-slate-600 border-slate-200" },
            };
            const current = config[diagramType] || config["process"];
            return (
              <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase tracking-wide whitespace-nowrap shadow-sm ${current.color}`}>
                {current.label}
              </span>
            );
          })()}
        </div>
      </div>

      {/* ─── RIGHT: Status & Actions ─── */}
      <div className="flex items-center gap-4">
        {/* Sync time */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-medium tracking-wide">{lastSavedTime}</span>
        </div>

        {/* AI status indicator */}
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

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Save button */}
          <button
            onClick={handleSave}
            title="Lưu sơ đồ (Ctrl+S)"
            className="bg-[#0066cc] hover:bg-blue-700 active:scale-95 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Lưu</span>
          </button>

          {/* Export dropdown */}
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              title="Xuất sơ đồ"
              className="border border-slate-200 hover:border-slate-300 active:scale-95 bg-white text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#0066cc]" />
              <span className="hidden sm:inline">Xuất</span>
              <span className="text-slate-400 text-xs">▾</span>
            </button>

            <AnimatePresence>
              {exportOpen && (
                <motion.div
                  key="export-menu"
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-[200] overflow-hidden"
                >
                  {[
                    {
                      label: "Xuất JPEG",
                      hint: "Ảnh nén nhẹ",
                      action: () => { handleExportPNG(); setExportOpen(false); },
                      color: "text-slate-700",
                    },
                    {
                      label: "Xuất PDF",
                      hint: "In & chia sẻ",
                      action: () => { handleExportPDF?.(); setExportOpen(false); },
                      color: "text-red-600",
                    },
                    {
                      label: "Xuất SVG",
                      hint: "Vector sắc nét",
                      action: () => { handleExportSVG?.(); setExportOpen(false); },
                      color: "text-emerald-600",
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors ${item.color}`}
                    >
                      <span className="text-sm font-bold">{item.label}</span>
                      <span className="text-[10px] text-slate-400">{item.hint}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
