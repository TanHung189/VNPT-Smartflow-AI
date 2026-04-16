import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { diagramApi, DiagramListItem } from "../services/diagramApi";
import { isToday, isYesterday, isThisWeek } from "date-fns";
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
  Sparkles
} from "lucide-react";

const templates = [
  { id: "blank", name: "Trang trắng", icon: <Plus className="w-8 h-8 text-slate-400" /> },
  { id: "ai", name: "AI Playground", isAi: true },
  { id: "network", name: "Hạ tầng VNPT", color: "bg-blue-100" },
  { id: "ioffice", name: "Quy trình iOffice", color: "bg-emerald-100" },
  { id: "cloud", name: "Kiến trúc Cloud", color: "bg-cyan-100" },
  { id: "ioc", name: "Smart City", color: "bg-purple-100" },
  { id: "uml", name: "Chuẩn UML", color: "bg-amber-100" },
];

const DashBoard: React.FC = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Home");
  const [recentDiagrams, setRecentDiagrams] = useState<DiagramListItem[]>([]);
  const [isLoadingDiagrams, setIsLoadingDiagrams] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const fetchDiagrams = async () => {
      setIsLoadingDiagrams(true);
      try {
        const token = localStorage.getItem("token");
        const data = await diagramApi.getAll(token);
        setRecentDiagrams(Array.isArray(data) ? data : []);
      } catch (error) {
      } finally {
        setIsLoadingDiagrams(false);
      }
    };
    if (user) {
      fetchDiagrams();
      intervalId = setInterval(async () => {
        try {
          const token = localStorage.getItem("token");
          const data = await diagramApi.getAll(token);
          setRecentDiagrams(Array.isArray(data) ? data : []);
        } catch (error) {}
      }, 30000); // 30s auto-polling
    }
    return () => clearInterval(intervalId);
  }, [user]);

  const groupedDiagrams = React.useMemo(() => {
    const groups: { label: string; items: DiagramListItem[] }[] = [
      { label: "Hôm nay", items: [] },
      { label: "Hôm qua", items: [] },
      { label: "Tuần này", items: [] },
      { label: "Cũ hơn", items: [] },
    ];
    recentDiagrams.forEach((d) => {
      const date = new Date(d.ngay_cap_nhat);
      if (isToday(date)) groups[0].items.push(d);
      else if (isYesterday(date)) groups[1].items.push(d);
      else if (isThisWeek(date)) groups[2].items.push(d);
      else groups[3].items.push(d);
    });
    return groups.filter(g => g.items.length > 0);
  }, [recentDiagrams]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white font-sans text-slate-800">
      {/* ─── LEFT SIDEBAR (Miro Style) ─── */}
      <aside className="w-64 border-r border-slate-200 flex flex-col">
        {/* Workspace selector / User Profile */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer rounded-lg transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 font-bold rounded flex items-center justify-center text-sm">
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
              placeholder="Search by title..."
              className="bg-transparent border-none outline-none text-sm w-full ml-2 text-slate-700 placeholder:text-slate-400 py-1"
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 space-y-1">
          <button
            onClick={() => setActiveTab("Home")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "Home"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Home className="w-4 h-4" /> Home
          </button>
          <button
            onClick={() => setActiveTab("Recent")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "Recent"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Clock className="w-4 h-4" /> Recent
          </button>
          <button
            onClick={() => setActiveTab("Starred")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "Starred"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Star className="w-4 h-4" /> Starred
          </button>
        </nav>

        {/* Spaces & Logout */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-bold text-slate-800">Spaces</span>
            <button className="text-slate-400 hover:text-slate-600">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={logout}
            className="w-full mt-4 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col overflow-auto bg-slate-50/30">
        
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-black text-xl tracking-tighter">smartflow</span>
            <span className="px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 rounded uppercase">Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex text-sm font-semibold text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors gap-2 items-center">
               Invite members
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-all shadow-sm">
               Upgrade
            </button>
            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Gift className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#0066cc] text-white flex items-center justify-center font-bold text-xs ml-2 shadow-sm uppercase">
              {user.name ? user.name.charAt(0) : "U"}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 max-w-6xl w-full mx-auto p-8 lg:px-12 xl:px-16 space-y-12">
          
          {/* Templates Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-slate-800">Templates for VNPT Engineering</h2>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex-shrink-0 w-48 group">
                  <div
                    onClick={() => {
                        if (tpl.id === "blank") navigate("/DrawDiagram");
                        else if (tpl.isAi) navigate("/DrawDiagram");
                        else navigate(`/DrawDiagram?template=${tpl.id}`);
                    }}
                    className={`h-32 border border-slate-200 rounded-xl mb-3 flex items-center justify-center cursor-pointer transition-all ${
                      tpl.id === "blank" 
                       ? "bg-white hover:border-blue-400 hover:shadow-md" 
                       : tpl.isAi 
                       ? "bg-slate-50 relative overflow-hidden hover:border-blue-400 hover:shadow-md" 
                       : `${tpl.color || "bg-white"} hover:opacity-90`
                    }`}
                  >
                     {tpl.icon && tpl.icon}
                     {tpl.isAi && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                         <div className="w-16 h-8 bg-white rounded-md shadow-sm border border-slate-100 mb-2 flex items-center p-1 gap-1">
                           <div className="w-4 h-4 bg-orange-100 text-orange-600 flex items-center justify-center rounded-[4px]"><Sparkles className="w-2.5 h-2.5"/></div>
                           <div className="h-1 w-8 bg-slate-200 rounded-full"></div>
                         </div>
                         <div className="flex gap-1.5">
                           <div className="w-5 h-4 bg-purple-100 rounded-sm"></div>
                           <div className="w-8 h-4 bg-emerald-100 rounded-sm"></div>
                           <div className="w-4 h-4 bg-blue-100 rounded-sm"></div>
                         </div>
                       </div>
                     )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 text-center flex items-center justify-center gap-1">
                    {tpl.isAi && <Sparkles className="w-3 h-3 text-[#0066cc]" />}
                    {tpl.name}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Boards Section */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Boards in this team</h2>
              <div className="flex items-center gap-3">
                <button className="text-sm font-semibold text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 bg-white transition-colors">
                  Explore templates
                </button>
                <button
                  onClick={() => navigate("/DrawDiagram")} 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create new
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6 py-2 border-b border-slate-200">
               <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                 <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 bg-slate-100 px-2 py-1 rounded">All boards <span className="text-[10px]">▼</span></div>
                 <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">Owned by anyone <span className="text-[10px]">▼</span></div>
                 <div className="hidden md:flex items-center gap-1.5 cursor-pointer hover:text-slate-900 ml-4">Last opened <span className="text-[10px]">▼</span></div>
               </div>
               <div className="flex bg-slate-100 p-0.5 rounded-lg">
                 <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}><LayoutGrid className="w-4 h-4" /></button>
                 <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}><List className="w-4 h-4" /></button>
               </div>
            </div>

            {/* Danh sách Diagrams từ DB */}
            {isLoadingDiagrams ? (
              <div className="flex justify-center items-center py-16">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentDiagrams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 border-dashed rounded-3xl">
                <FolderOpen className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-800">No boards created yet</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">Create your first board or try a template.</p>
                <button
                   onClick={() => navigate("/DrawDiagram")}
                   className="bg-slate-900 hover:bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                   Create New Board
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="space-y-8">
                {groupedDiagrams.map((group) => (
                  <div key={group.label}>
                    <h3 className="text-sm font-bold text-slate-500 mb-3 ml-1">{group.label}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {group.items.map((d) => (
                        <div 
                          key={d.id_so_do} 
                          onClick={() => navigate(`/DrawDiagram?id=${d.id_so_do}`)}
                          className="bg-white border hover:border-blue-400 hover:shadow-md cursor-pointer border-slate-200 p-4 rounded-xl transition-all h-40 flex flex-col justify-between overflow-hidden relative group"
                        >
                          {d.anh_thu_nho && (
                            <div className="absolute inset-x-0 top-0 h-24 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-1">
                              <img 
                                src={d.anh_thu_nho} 
                                alt="Thumbnail" 
                                className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
                              />
                            </div>
                          )}
                          <div className={`relative z-10 ${d.anh_thu_nho ? "mt-24 pt-2 border-t border-slate-100" : ""}`}>
                            <h4 className="font-bold text-slate-800 truncate leading-tight">{d.tieu_de}</h4>
                            <p className="text-[11px] text-slate-500 capitalize">{d.the_loai}</p>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-auto flex justify-between items-center">
                            <span>{new Date(d.ngay_cap_nhat).toLocaleDateString("vi-VN")}</span>
                            <span className="bg-slate-100 px-1.5 rounded">{d.la_noi_bo ? 'Local' : 'Cloud'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm space-y-4 bg-slate-50/50 p-4">
                <div className="flex items-center px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="w-12"></div>
                  <div className="flex-1">Tên bảng</div>
                  <div className="w-32">Loại AI</div>
                  <div className="w-40 text-right">Cập nhật</div>
                </div>
                {groupedDiagrams.map((group) => (
                  <div key={group.label} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-100">
                      {group.label}
                    </div>
                    {group.items.map((d, idx) => (
                      <div
                        key={d.id_so_do}
                        onClick={() => navigate(`/DrawDiagram?id=${d.id_so_do}`)}
                        className={`flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${idx !== group.items.length - 1 ? 'border-b border-slate-50' : ''}`}
                      >
                        <div className="w-12">
                          {d.anh_thu_nho ? (
                            <div className="w-8 h-8 rounded shrink-0 bg-white border border-slate-200 overflow-hidden">
                              <img src={d.anh_thu_nho} className="w-full h-full object-contain" alt="" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
                              <FolderOpen className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm">{d.tieu_de}</h4>
                          <p className="text-[10px] text-slate-500 capitalize">{d.the_loai}</p>
                        </div>
                        <div className="w-32">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.la_noi_bo ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                            {d.la_noi_bo ? 'Nội bộ' : 'Đám mây'}
                          </span>
                        </div>
                        <div className="w-40 text-right text-xs text-slate-500 font-medium">
                          {new Date(d.ngay_cap_nhat).toLocaleTimeString("vi-VN", {hour: "2-digit", minute: "2-digit"})}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

          </section>

        </div>
      </main>
    </div>
  );
};

export default DashBoard;
