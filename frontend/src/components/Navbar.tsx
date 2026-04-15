import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MousePointer2, Zap, LogOut, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const isAuthenticated = !!token;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isEditor =
    location.pathname === "/DrawDiagram" || location.pathname === "/editor";

  if (isEditor) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled
          ? "py-3 bg-white/80 backdrop-blur-lg shadow-[0_2px_20px_rgb(0,0,0,0.04)] border-b border-slate-200"
          : isEditor
            ? "py-3 bg-white border-b border-slate-200"
            : "py-6 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        {/* LOGO - VNPT SmartFlow */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0054a6] to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50 transition-all duration-300 group-hover:scale-105 group-hover:rotate-6">
            <MousePointer2 className="text-white w-5 h-5 fill-white/20" />
          </div>
          <span className="text-2xl font-[900] text-slate-900 tracking-tight flex items-center gap-1.5">
            <span className="text-[#0054a6]">VNPT</span>
            SmartFlow
          </span>
        </Link>

        {/* MENU ITEMS (Floating Pill) */}
        <div className="hidden md:flex items-center gap-8 bg-slate-100/60 backdrop-blur-sm px-6 py-2 rounded-full border border-slate-200/60 shadow-inner shadow-white/50">
          <NavLink
            to="/"
            label="Trang chủ"
            active={location.pathname === "/"}
          />
          <NavLink
            to="/DrawDiagram"
            label="Trình vẽ AI"
            active={location.pathname === "/DrawDiagram"}
          />
          <NavLink
            to="/DashBoard"
            label="Kho dữ liệu"
            active={location.pathname === "/DashBoard"}
          />
          <NavLink
            to="/admin"
            label="Admin"
            active={location.pathname === "/admin"}
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 bg-white px-2 py-1.5 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 pl-2">
                <div className="w-8 h-8 md:w-7 md:h-7 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                  <User className="w-4 h-4 text-[#0054a6]" />
                </div>
                <span className="text-sm font-bold text-slate-700 max-w-[100px] truncate hidden sm:block">
                  {userData.user_name || "User"}
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
              <button
                onClick={handleLogout}
                className="w-8 h-8 flex items-center justify-center hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-colors group"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-bold text-slate-600 hover:text-[#0054a6] transition-colors hidden sm:block px-2"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 bg-[#0054a6] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all shadow-[0_8px_20px_rgba(0,84,166,0.3)] hover:shadow-[0_10px_25px_rgba(0,84,166,0.5)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Bắt đầu</span>
                <Zap className="w-4 h-4 fill-current opacity-90" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Component con cho các liên kết menu
const NavLink = ({
  to,
  label,
  active,
}: {
  to: string;
  label: string;
  active: boolean;
}) => (
  <Link
    to={to}
    className={`text-sm font-bold transition-all relative group py-1 ${
      active ? "text-[#0054a6]" : "text-slate-500 hover:text-slate-900"
    }`}
  >
    {label}
    <span
      className={`absolute -bottom-[6px] left-1/2 -translate-x-1/2 h-[3px] rounded-t-full transition-all duration-300 ${
        active ? "w-1/2 bg-[#0054a6]" : "w-0 bg-slate-300 group-hover:w-1/3"
      }`}
    />
  </Link>
);

export default Navbar;
