import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, LayoutDashboard, X, Search, Trash2, Loader2 } from "lucide-react";
import { diagramApi, DiagramListItem } from "../../services/diagramApi";
import { format } from "date-fns";
import { toast } from "sonner";

// Fake Badge component to match Shadcn
const Badge = ({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
}) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      variant === "outline"
        ? "border border-slate-200 text-slate-500"
        : "bg-blue-100 text-[#0066cc]"
    }`}
  >
    {children}
  </span>
);

interface HistoryDrawerProps {
  onLoadDiagram: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  onLoadDiagram,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<DiagramListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchHistory = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem("token");
          const data = await diagramApi.getAll(token);
          if (Array.isArray(data)) {
            // Sắp xếp mới nhất lên đầu
            const sorted = data.sort((a, b) => new Date(b.ngay_cap_nhat).getTime() - new Date(a.ngay_cap_nhat).getTime());
            setHistory(sorted);
          } else {
            setHistory([]);
          }
        } catch (e) {
          toast.error("Lỗi khi tải lịch sử sơ đồ");
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen]);

  const filteredHistory = history.filter((item) =>
    item.tieu_de.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn xóa sơ đồ này không?")) return;
    try {
      const token = localStorage.getItem("token");
      await diagramApi.delete(id, token);
      setHistory((prev) => prev.filter((item) => item.id_so_do !== id));
      toast.success("Xóa sơ đồ thành công");
    } catch (e) {
      toast.error("Không thể xóa sơ đồ");
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 hover:bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 hover:text-[#0066cc] transition-colors"
        title="Lịch sử sơ đồ"
      >
        <LayoutDashboard className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
            />

            {/* SHEET CONTENT */}
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[350px] bg-white/95 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl z-50 flex flex-col"
            >
              {/* HEADER */}
              <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                  <History className="w-5 h-5 text-[#0066cc]" />
                  <h2 className="font-bold tracking-tight text-lg font-geist">
                    Lịch sử quy trình
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* SEARCH */}
              <div className="p-4 px-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sơ đồ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all font-geist"
                  />
                </div>
              </div>

              {/* LIST / SCROLL AREA */}
              <div className="flex-1 overflow-y-auto p-4 pt-0 flex flex-col gap-2 custom-scrollbar">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-8 h-full text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#0066cc]" />
                    <span className="text-sm font-medium font-geist">Đang tải lịch sử...</span>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center p-6 text-slate-400 text-sm italic font-geist">
                    Không tìm thấy sơ đồ nào.
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <button
                      key={item.id_so_do}
                      onClick={() => {
                        onLoadDiagram(item.id_so_do);
                        setIsOpen(false);
                      }}
                      className="relative w-full text-left p-3 rounded-xl border border-transparent hover:border-[#0066cc]/20 hover:bg-[#0066cc]/5 flex flex-col gap-2 transition-all group font-geist"
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className="font-bold text-slate-700 group-hover:text-[#0066cc] text-sm break-words pr-6 line-clamp-1">
                          {item.tieu_de}
                        </span>
                        <Badge variant={item.la_mau_chuan ? "default" : "outline"}>
                          {item.la_mau_chuan ? "TEMPLATE" : "LOCAL"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {format(new Date(item.ngay_cap_nhat), "dd/MM/yyyy HH:mm")}
                        </span>
                        <span className="text-[10px] text-slate-300 font-medium px-1 bg-slate-50 rounded">
                          {item.the_loai || "process"}
                        </span>
                      </div>

                      {/* Trash Button */}
                      <div
                        onClick={(e) => handleDelete(e, item.id_so_do)}
                        className="absolute right-3 bottom-2.5 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa sơ đồ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-center">
                <span className="text-[10px] text-slate-400 tracking-wider uppercase font-bold">
                  VNPT SmartFlow AI
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
