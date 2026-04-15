import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, LayoutDashboard, X, Search, Trash2 } from "lucide-react";
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

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  status: "Mới" | "Đã lưu";
}

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "1",
    title: "Quy trình cước viễn thông",
    date: "Hôm qua 15:30",
    status: "Mới",
  },
  {
    id: "2",
    title: "Lắp đặt thiết bị KH",
    date: "12/04/2026",
    status: "Đã lưu",
  },
  {
    id: "3",
    title: "Đăng ký thuê bao cáp quang",
    date: "10/04/2026",
    status: "Đã lưu",
  },
];

interface HistoryDrawerProps {
  onLoadDiagram: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  onLoadDiagram,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>(MOCK_HISTORY);

  const filteredHistory = history.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Simulate API soft delete
    setHistory((prev) => prev.filter((item) => item.id !== id));
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
                {filteredHistory.length === 0 ? (
                  <div className="text-center p-6 text-slate-400 text-sm italic font-geist">
                    Không tìm thấy sơ đồ nào.
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onLoadDiagram(item.id)}
                      className="relative w-full text-left p-3 rounded-xl border border-transparent hover:border-[#0066cc]/20 hover:bg-[#0066cc]/5 flex flex-col gap-2 transition-all group font-geist"
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className="font-bold text-slate-700 group-hover:text-[#0066cc] text-sm break-words pr-6">
                          {item.title}
                        </span>
                        <Badge
                          variant={
                            item.status === "Mới" ? "default" : "outline"
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.date}
                        </span>
                      </div>

                      {/* Trash Button */}
                      <div
                        onClick={(e) => handleDelete(e, item.id)}
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
