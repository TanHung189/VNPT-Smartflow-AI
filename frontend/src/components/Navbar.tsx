import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MousePointer2, Zap } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // 1. Logic theo dõi sự kiện cuộn chuột
  useEffect(() => {
    const handleScroll = () => {
      // Nếu cuộn quá 20px thì đổi trạng thái
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Kiểm tra nếu đang ở trang Editor thì luôn hiện nền trắng để không bị rối sơ đồ
  const isEditor = location.pathname === "/editor";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-8 ${
        isScrolled || isEditor
          ? "py-3 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-slate-200/50"
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
            VNPT{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0062ff] to-[#60a5fa]">
              SmartFlow
            </span>
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

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-6">
          <Link
            to="/editor"
            className="flex items-center gap-2 bg-[#0054a6] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#004080] transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            <span>Dùng thử</span>
            <Zap className="w-3 h-3 fill-current" />
          </Link>
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
    className={`text-sm font-bold transition-all relative group ${
      active ? "text-[#0054a6]" : "text-slate-600 hover:text-[#0054a6]"
    }`}
  >
    {label}
    {/* Hiệu ứng gạch chân khi active hoặc hover */}
    <span
      className={`absolute -bottom-1 left-0 h-0.5 bg-[#0054a6] rounded-full transition-all duration-300 ${
        active ? "w-full" : "w-0 group-hover:w-full"
      }`}
    />
  </Link>
);

export default Navbar;
