import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { PlusCircle, FolderOpen, Settings, Home, LogOut, User as UserIcon } from "lucide-react";

const DashBoard: React.FC = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  // Safety fallback if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Đang tải thông tin người dùng...</p>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 gap-6">
          <div className="flex items-center gap-5">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.name || user.user_name || 'User'}&background=005A9C&color=fff`} 
              alt="Avatar" 
              className="w-16 h-16 rounded-full border-4 border-blue-50 shadow-sm"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                Xin chào, {user.name || user.user_name || 'Người dùng'} 👋
              </h1>
              <p className="text-[#005A9C] font-semibold mt-1 bg-blue-50 px-3 py-1 rounded-full w-fit text-sm flex items-center gap-1.5">
                <UserIcon className="w-4 h-4" />
                Vai trò: {isAdmin ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm w-full md:w-auto"
            >
              <Home className="w-5 h-5" />
              Quay lại Home
            </button>
            <button 
              onClick={logout}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-red-100 text-red-600 font-semibold rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm w-full md:w-auto"
            >
              <LogOut className="w-5 h-5" />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <h2 className="text-lg font-bold text-gray-800 mb-6 px-2">Lối tắt chức năng</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Default User Buttons */}
          <button 
            onClick={() => navigate("/DrawDiagram")}
            className="group relative bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#005A9C] rounded-l-3xl"></div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#005A9C] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tạo phiên Canvas mới</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Bắt đầu vẽ và thiết kế sơ đồ quy trình AI thông minh lập tức.</p>
          </button>

          <button 
            onClick={() => alert("Đang phát triển!")}
            className="group relative bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quy trình của tôi</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Xem lại danh sách các sơ đồ quy trình mà bạn đã tạo và lưu trữ.</p>
          </button>

          {/* Conditional Admin Button */}
          {isAdmin && (
            <button 
              onClick={() => navigate("/admin")}
              className="group relative bg-gradient-to-br from-[#005A9C] to-[#004a82] p-8 rounded-3xl shadow-lg border border-transparent hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-6 backdrop-blur-sm group-hover:scale-110 transition-transform shadow-inner">
                <Settings className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Quản trị hệ thống</h3>
              <p className="text-blue-100 text-sm leading-relaxed">Truy cập Admin Dashboard để xem thống kê và quản lý người dùng toàn hệ thống.</p>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default DashBoard;
