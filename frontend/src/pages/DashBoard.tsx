import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
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
  { id: "blank", name: "Blank board", icon: <Plus className="w-8 h-8 text-slate-400" /> },
  { id: "ai", name: "AI Playground", isAi: true },
  { id: "retro", name: "Retrospective", color: "bg-orange-100" },
  { id: "kanban", name: "Kanban Framework", color: "bg-blue-100" },
  { id: "sequence", name: "UML Sequence", color: "bg-purple-100" },
];

const DashBoard: React.FC = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Home");

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
                    onClick={() => tpl.id === "blank" || tpl.isAi ? navigate("/DrawDiagram") : null}
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
                 <button className="p-1.5 bg-white text-slate-800 shadow-sm rounded-md"><LayoutGrid className="w-4 h-4" /></button>
                 <button className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md"><List className="w-4 h-4" /></button>
               </div>
            </div>

            {/* Empty State / List */}
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

          </section>

        </div>
      </main>
    </div>
  );
};

export default DashBoard;
