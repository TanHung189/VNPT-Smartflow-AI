import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import {
  Search,
  Home,
  Clock,
  Star,
  Plus,
  Bell,
  Trash2,
  Github,
} from "lucide-react";
import { UserProfileModal } from "../profile/UserProfileModal";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: "Home" | "Recent" | "Starred" | "Trash";
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
}) => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f9f9fa] font-sans text-slate-800">
      {/* ─── LEFT SIDEBAR (Miro Style) ─── */}
      <aside className="hidden lg:flex w-64 border-r border-[#e5e5e5] bg-white flex-col z-10 transition-all shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        {/* Workspace selector / User Profile */}
        <div className="p-4 py-5 shrink-0 border-b border-[#e5e5e5]">
          <div
            className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer rounded-lg transition-colors group"
            onClick={() => setIsProfileOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#0066cc]/10 text-[#0066cc] font-bold rounded-md flex items-center justify-center text-sm border border-[#0066cc]/20">
                VN
              </div>
              <div className="overflow-hidden">
                <p className="text-[15px] font-bold text-slate-900 truncate">
                  VNPT Workspace
                </p>
                <p className="text-[13px] text-slate-500 truncate mt-0.5">
                  {user.name || user.ten_nguoi_dung || "Người dùng"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="p-4 pb-2">
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 hover:border-[#0066cc] focus-within:border-[#0066cc] focus-within:ring-2 focus-within:ring-[#0066cc]/20 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sơ đồ..."
              className="bg-transparent border-none outline-none text-[14px] w-full ml-2 text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 mt-2 space-y-1">
          <button
            onClick={() => navigate("/dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-[14px] transition-all duration-200 ${
              activeTab === "Home"
                ? "bg-[#ebf3fb] text-[#0066cc]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Home
              className="w-[18px] h-[18px]"
              strokeWidth={activeTab === "Home" ? 2.5 : 2}
            />{" "}
            Bảng điều khiển
          </button>
          <button
            onClick={() => navigate("/recent")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-[14px] transition-all duration-200 ${
              activeTab === "Recent"
                ? "bg-[#ebf3fb] text-[#0066cc]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Clock
              className="w-[18px] h-[18px]"
              strokeWidth={activeTab === "Recent" ? 2.5 : 2}
            />{" "}
            Gần đây
          </button>
          <button
            onClick={() => navigate("/starred")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-[14px] transition-all duration-200 ${
              activeTab === "Starred"
                ? "bg-[#ebf3fb] text-[#0066cc]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Star
              className="w-[18px] h-[18px]"
              strokeWidth={activeTab === "Starred" ? 2.5 : 2}
            />{" "}
            Đã gắn sao
          </button>
          <button
            onClick={() => navigate("/trash")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-[14px] transition-all duration-200 ${
              activeTab === "Trash"
                ? "bg-[#ebf3fb] text-[#0066cc]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Trash2
              className="w-[18px] h-[18px]"
              strokeWidth={activeTab === "Trash" ? 2.5 : 2}
            />{" "}
            Thùng rác
          </button>
        </nav>

        {/* Spaces & Logout */}
        <div className="p-4 shrink-0 transition-opacity">
          <button
            onClick={() => navigate("/DrawDiagram")}
            className="w-full mb-3 flex items-center justify-center gap-2 bg-[#0066cc] hover:bg-[#0055aa] text-white font-bold py-2.5 rounded-lg transition-colors text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tạo sơ đồ mới
          </button>
          <button
            onClick={logout}
            className="w-full text-center px-3 py-2 text-[14px] text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f9f9fa] overflow-hidden">
        {/* Top Navbar */}
        <header className="h-[60px] border-b border-[#e5e5e5] bg-white flex items-center justify-between px-6 shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.02)] z-10 w-full">
          <div className="flex items-center gap-4">
            <span className="font-black text-[22px] tracking-tight text-[#0066cc]">
              SmartFlow
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-amber-500 rounded uppercase tracking-wider hidden sm:inline-block">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Nút GitHub */}
            <a
              href="https://github.com/YOUR_GITHUB_USERNAME/VNPT-Smartflow-AI"
              target="_blank"
              rel="noopener noreferrer"
              title="Xem mã nguồn trên GitHub"
              className="p-2 flex items-center justify-center text-slate-900 transition-colors rounded-full hover:bg-slate-200 dark:text-white dark:hover:bg-slate-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>

            <div className="w-[1px] h-6 bg-slate-200 mx-1" />

            <button
              onClick={() => setIsProfileOpen(true)}
              className="h-[34px] w-[34px] ml-2 rounded-full overflow-hidden flex items-center justify-center bg-[#ebf3fb] border border-[#0066cc]/20 transition-transform hover:scale-105 active:scale-95"
            >
              <span className="text-[#0066cc] font-black text-sm uppercase">
                {user?.name
                  ? user.name.charAt(0)
                  : user?.ten_nguoi_dung
                    ? user.ten_nguoi_dung.charAt(0)
                    : "U"}
              </span>
            </button>
          </div>
        </header>

        {/* Render child content */}
        <div className="flex-1 overflow-auto bg-[#f9f9fa]">
          <div className="w-full h-full">{children}</div>
        </div>
      </main>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;
