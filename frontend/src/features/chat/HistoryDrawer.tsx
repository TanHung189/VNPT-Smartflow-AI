import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, LayoutDashboard, X, Search, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { diagramApi, DiagramListItem } from "../../services/diagramApi";

// ─── Badge ───────────────────────────────────────────────────
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

// ─── Types ───────────────────────────────────────────────────
interface HistoryDrawerProps {
  onLoadDiagram: (id: string, flowData?: any) => void;
}

// ─── Component ───────────────────────────────────────────────
export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  onLoadDiagram,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [diagrams, setDiagrams] = useState<DiagramListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // ─── Fetch từ API thật ───────────────────────────────────
  const fetchDiagrams = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await diagramApi.getAll(token);
      setDiagrams(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error("Không thể tải lịch sử sơ đồ.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch khi mở drawer
  useEffect(() => {
    if (isOpen) fetchDiagrams();
  }, [isOpen, fetchDiagrams]);

  // ─── Search + Sort (client-side ILIKE) ───────────────────
  const filtered = diagrams
    .filter((d) =>
      d.tieu_de.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const da = new Date(a.ngay_cap_nhat).getTime();
      const db = new Date(b.ngay_cap_nhat).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

  // ─── Delete ───────────────────────────────────────────────
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await diagramApi.delete(id, token);
      setDiagrams((prev) => prev.filter((d) => d.id_so_do !== id));
      toast.success("Đã xóa sơ đồ.");
    } catch {
      toast.error("Không thể xóa sơ đồ này.");
    }
  };

  // ─── Load diagram vào canvas ─────────────────────────────
  const handleLoad = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const detail = await diagramApi.getById(id, token);
      onLoadDiagram(id, detail.du_lieu_so_do);
      setIsOpen(false);
      toast.success("Đã tải sơ đồ lên canvas.");
    } catch {
      toast.error("Không thể tải sơ đồ này.");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    if (diffH < 1) return "Vừa xong";
    if (diffH < 24) return `${diffH} giờ trước`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <>
      {/* Trigger Button */}
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
            />

            {/* Drawer Sheet */}
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[360px] bg-white/95 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                  <History className="w-5 h-5 text-[#0066cc]" />
                  <h2 className="font-bold tracking-tight text-lg">
                    Sơ đồ của tôi
                  </h2>
                  {!isLoading && (
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-1">
                      {filtered.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={fetchDiagrams}
                    disabled={isLoading}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    title="Làm mới"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search + Filter Bar */}
              <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all"
                  />
                </div>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="text-xs font-bold text-slate-600 border border-slate-200 bg-slate-50 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 h-40 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0066cc]" />
                    <span className="text-sm font-medium">Đang tải dữ liệu...</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 text-sm italic">
                    {searchQuery ? `Không tìm thấy sơ đồ với từ khóa "${searchQuery}"` : "Chưa có sơ đồ nào. Hãy tạo sơ đồ đầu tiên!"}
                  </div>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item.id_so_do}
                      onClick={() => handleLoad(item.id_so_do)}
                      className="relative w-full text-left p-3 rounded-xl border border-transparent hover:border-[#0066cc]/20 hover:bg-[#0066cc]/5 flex flex-col gap-2 transition-all group"
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className="font-bold text-slate-700 group-hover:text-[#0066cc] text-sm break-words pr-6 line-clamp-2">
                          {item.tieu_de}
                        </span>
                        <Badge variant={item.la_noi_bo ? "outline" : "default"}>
                          {item.la_noi_bo ? "Local" : "Cloud"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDate(item.ngay_cap_nhat)}
                        </span>
                        <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">
                          {item.the_loai}
                        </span>
                      </div>

                      {/* Trash */}
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
