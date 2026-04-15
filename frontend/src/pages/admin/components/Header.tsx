import React, { useState } from 'react';
import { Bell, User, LogOut, Settings as SettingsIcon, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  adminName?: string;
}

export const Header: React.FC<HeaderProps> = ({ adminName = 'Admin, Hưng!' }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm shrink-0 sticky top-0 z-10 w-full transition-all">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Chào {adminName} 👋
          </h1>
          <p className="text-sm text-gray-500">Hệ thống quản trị mạng và quy trình</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-[#005A9C] text-white rounded-lg hover:bg-[#004a82] transition-colors shadow-md hover:shadow-lg font-medium text-sm"
        >
          <Home className="w-4 h-4" />
          Quay lại trang chủ
        </button>

        <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

        <button className="relative p-2 text-gray-400 hover:text-[#005A9C] transition-colors rounded-full hover:bg-blue-50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="relative">
          <button 
            type="button" 
            className="flex items-center gap-3 focus:outline-none"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-semibold text-gray-900">VNPT Admin</span>
              <span className="text-xs text-gray-500">Quản trị viên</span>
            </div>
            <img className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover shadow-sm" src="https://ui-avatars.com/api/?name=Admin+VNPT&background=005A9C&color=fff" alt="User avatar" />
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#005A9C] transition-colors">
                <User className="w-4 h-4" />
                Hồ sơ
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#005A9C] transition-colors">
                <SettingsIcon className="w-4 h-4" />
                Cài đặt
              </button>
              <div className="h-px bg-gray-100 my-2"></div>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
