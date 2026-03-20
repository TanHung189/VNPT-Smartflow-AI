import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MousePointer2, Zap, LogOut, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth"; // Import hook dùng chung

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth(); // Lấy hàm logout từ hook

  // 1. Kiểm tra trạng thái đăng nhập
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-8 ${
        isScrolled || isEditor
          ? "py-3 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-slate-200/50"
          : "py-6 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* LOGO - VNPT SmartFlow */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-[#0054a6] rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 transition-transform group-hover:rotate-12">
            <MousePointer2 className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-[900] text-slate-950 tracking-tight">
            SmartFlow{" "}
          </span>
        </Link>

        {/* MENU ITEMS */}
        <div className="hidden md:flex items-center gap-10">
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
        </div>

        {/* ACTION BUTTONS - Thay đổi dựa trên trạng thái Login */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            /* KHI ĐÃ ĐĂNG NHẬP */
            <div className="flex items-center gap-4 bg-slate-100/50 p-1.5 pl-4 rounded-full border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-slate-700 max-w-[100px] truncate">
                  {userData.user_name || "User"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* KHI CHƯA ĐĂNG NHẬP */
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-bold text-slate-600 hover:text-[#0054a6] px-4 transition-all"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 bg-[#0054a6] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#004080] transition-all shadow-lg shadow-blue-100 active:scale-95"
              >
                <span>Bắt đầu ngay</span>
                <Zap className="w-3 h-3 fill-current" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Component con cho các liên kết menu (Giữ nguyên của Hưng)
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
    className={`text-sm font-bold transition-all relative group ${
      active ? "text-[#0054a6]" : "text-slate-600 hover:text-[#0054a6]"
    }`}
  >
    {label}
    <span
      className={`absolute -bottom-1 left-0 h-0.5 bg-[#0054a6] rounded-full transition-all duration-300 ${
        active ? "w-full" : "w-0 group-hover:w-full"
      }`}
    />
  </Link>
);

export default Navbar;
