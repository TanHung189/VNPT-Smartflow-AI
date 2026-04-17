import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { diagramApi, DiagramListItem } from "../services/diagramApi";
import { toast } from "sonner";
import {
  Search,
  Home,
  Clock,
  Star,
  Plus,
  Gift,
  Bell,
  MoreVertical,
  LayoutGrid,
  List,
  FolderOpen,
  Sparkles,
  FileBox,
} from "lucide-react";

const templates = [
  {
    id: "blank",
    name: "Trắng (Từ đầu)",
    icon: <Plus className="w-8 h-8 text-slate-400" />,
  },
  { id: "ai", name: "Smart AI Playground", isAi: true },
  { id: "org-chart", name: "Sơ đồ Tổ chức (HR)", color: "bg-orange-100" },
  { id: "ioffice", name: "Quy trình iOffice", color: "bg-emerald-100" },
  { id: "layered", name: "Kiến trúc Phân tầng", color: "bg-blue-100" },
  { id: "mindmap", name: "Sơ đồ Tư duy (Mindmap)", color: "bg-amber-100" },
  { id: "uml", name: "Sơ đồ Phần mềm (UML)", color: "bg-purple-100" },
];

export const DashBoard: React.FC = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Home");
  const [diagrams, setDiagrams] = useState<DiagramListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  // ─────────────────── AUTO-POLLING API ───────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchDiagrams = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await diagramApi.getAll(token);
        if (isMounted) {
          setDiagrams(Array.isArray(data) ? data : []);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    };

    // Initial fetch
    fetchDiagrams();

    // Setup polling every 30s as per Miro-style Realtime Data
    const interval = setInterval(fetchDiagrams, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ─────────────────── DATE GROUPING ───────────────────
  const groupedDiagrams = useMemo(() => {
    const today: DiagramListItem[] = [];
    const yesterday: DiagramListItem[] = [];
    const thisWeek: DiagramListItem[] = [];
    const older: DiagramListItem[] = [];

    diagrams.forEach((d) => {
      const date = new Date(d.ngay_cap_nhat);
      if (isToday(date)) today.push(d);
      else if (isYesterday(date)) yesterday.push(d);
      else if (isThisWeek(date)) thisWeek.push(d);
      else older.push(d);
    });
    return { today, yesterday, thisWeek, older };
  }, [diagrams]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]"></div>
      </div>
    );
  }

  const renderGroup = (title: string, list: DiagramListItem[]) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-800 mb-4 ml-1">{title}</h3>

        {viewMode === "grid" ? (
          // ─── GIAO DIỆN GRID (CŨ) ───
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {list.map((d) => (
              <div
                key={d.id_so_do}
                onClick={() => navigate(`/DrawDiagram?id=${d.id_so_do}`)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="h-32 bg-slate-50 border border-slate-200 rounded-xl mb-2 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 group-hover:shadow-md relative">
                  {d.anh_thu_nho ? (
                    <img
                      src={d.anh_thu_nho}
                      alt={d.tieu_de}
                      className="w-full h-full object-contain p-2 bg-white mix-blend-multiply opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <FileBox className="w-8 h-8 text-slate-300" />
                  )}
                  {d.la_noi_bo && (
                    <div className="absolute top-2 left-2 bg-teal-100/90 text-teal-800 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm border border-teal-200/50 flex flex-center gap-1">
                      LOCAL AI
                    </div>
                  )}
                  <button className="absolute top-2 right-2 p-1.5 bg-white/90 shadow-sm rounded border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 text-slate-600">
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-800 truncate px-1">
                  {d.tieu_de}
                </p>
                <p className="text-xs text-slate-500 truncate px-1">
                  Đã sửa: {format(new Date(d.ngay_cap_nhat), "HH:mm")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          // ─── GIAO DIỆN LIST (MỚI) ───
          <div className="flex flex-col gap-2">
            {list.map((d) => (
              <div
                key={d.id_so_do}
                onClick={() => navigate(`/DrawDiagram?id=${d.id_so_do}`)}
                className="group cursor-pointer flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail nhỏ xíu */}
                  <div className="w-20 h-14 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 relative">
                    {d.anh_thu_nho ? (
                      <img
                        src={d.anh_thu_nho}
                        alt={d.tieu_de}
                        className="w-full h-full object-contain bg-white mix-blend-multiply"
                      />
                    ) : (
                      <FileBox className="w-5 h-5 text-slate-300" />
                    )}
                  </div>

                  {/* Thông tin Text */}
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-[#0066cc] transition-colors">
                      {d.tieu_de}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500 font-medium">
                        Đã sửa: {format(new Date(d.ngay_cap_nhat), "HH:mm")}
                      </p>
                      {d.la_noi_bo && (
                        <span className="bg-teal-100 text-teal-800 text-[9px] font-bold px-1.5 py-[1px] rounded">
                          LOCAL AI
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nút Action */}
                <button className="p-2 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white font-sans text-slate-800">
      {/* ─── LEFT SIDEBAR (Miro Style) ─── */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 flex-col">
        {/* Workspace selector / User Profile */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer rounded-lg transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0066cc]/10 text-[#0066cc] font-bold rounded flex items-center justify-center text-sm border border-[#0066cc]/20">
                VN
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">VNPT Workspace</p>
                <p className="text-xs text-slate-500 truncate">
                  {user.name || user.ten_nguoi_dung || "Người dùng"}
                </p>
              </div>
            </div>
            <button className="text-slate-400 group-hover:text-slate-600 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Box */}
        <div className="p-4">
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sơ đồ..."
              className="bg-transparent border-none outline-none text-sm w-full ml-2 text-slate-700 placeholder:text-slate-400 py-1"
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 space-y-1">
          <button
            onClick={() => setActiveTab("Home")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-sm transition-colors ${
              activeTab === "Home"
                ? "bg-slate-100 text-[#0066cc]"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Home className="w-4 h-4" /> Bảng điều khiển
          </button>
          <button
            onClick={() => setActiveTab("Recent")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-sm transition-colors ${
              activeTab === "Recent"
                ? "bg-slate-100 text-[#0066cc]"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Clock className="w-4 h-4" /> Mới sử dụng
          </button>
          <button
            onClick={() => setActiveTab("Starred")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-sm transition-colors ${
              activeTab === "Starred"
                ? "bg-slate-100 text-[#0066cc]"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Star className="w-4 h-4" /> Đã gắn sao
          </button>
        </nav>

        {/* Spaces & Logout */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col overflow-auto bg-slate-50/30">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-black text-xl tracking-tighter text-[#0066cc]">
              SmartFlow
            </span>
            <span className="px-2 py-0.5 text-[8px] font-bold text-white bg-amber-500 rounded uppercase tracking-wider">
              Enterprise
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-[#0066cc] flex items-center justify-center font-black text-xs ml-2 border border-slate-200 uppercase cursor-pointer hover:bg-slate-200 transition-colors">
              {user.name ? user.name.charAt(0) : "U"}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 lg:px-12 xl:px-16 space-y-10">
          {/* Templates Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Enterprise Templates by VNPT
              </h2>
              <button className="text-sm font-bold text-[#0066cc] hover:text-blue-800 transition-colors">
                Tất cả mẫu
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex-shrink-0 w-48 group">
                  <div
                    onClick={() => navigate(`/DrawDiagram?template=${tpl.id}`)}
                    className={`h-32 border border-slate-200 rounded-2xl mb-3 flex items-center justify-center cursor-pointer transition-all ${
                      tpl.id === "blank"
                        ? "bg-white border-dashed hover:border-[#0066cc] hover:bg-blue-50/30"
                        : tpl.isAi
                          ? "bg-gradient-to-tr from-slate-900 to-slate-800 border-none hover:shadow-lg hover:shadow-slate-900/20 relative overflow-hidden"
                          : `${tpl.color || "bg-white"} hover:opacity-90`
                    }`}
                  >
                    {tpl.icon && tpl.icon}
                    {tpl.isAi && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse mb-2" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 text-center flex items-center justify-center gap-1.5 tracking-tight">
                    {tpl.isAi && (
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                    )}
                    {tpl.name}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Boards Section */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4 border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                VNPT Workspace
              </h2>
              {/* ─── NÚT TOGGLE GRID / LIST ─── */}
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-800"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-800"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]"></div>
              </div>
            ) : diagrams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 border-dashed rounded-3xl shrink-0">
                <FolderOpen className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-black text-slate-800 mb-1">
                  Chưa có sơ đồ nào
                </h3>
                <p className="text-sm font-medium text-slate-500 mb-6">
                  Bạn có thể tạo một sơ đồ mới hoặc sử dụng Mẫu của VNPT.
                </p>
                <button
                  onClick={() => navigate("/DrawDiagram")}
                  className="bg-[#0066cc] hover:bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Bắt đầu Vẽ sơ đồ
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {renderGroup("Hôm nay", groupedDiagrams.today)}
                {renderGroup("Hôm qua", groupedDiagrams.yesterday)}
                {renderGroup("7 ngày gần đây", groupedDiagrams.thisWeek)}
                {renderGroup("Cũ hơn", groupedDiagrams.older)}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashBoard;
