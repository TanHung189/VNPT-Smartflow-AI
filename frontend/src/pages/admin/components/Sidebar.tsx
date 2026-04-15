import React from 'react';
import { LayoutDashboard, Users, Workflow, Settings, Star, LogOut } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#005A9C] text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto shadow-xl z-20">
      <div className="flex items-center justify-center h-20 border-b border-blue-400">
        <div className="flex items-center gap-3">
          {/* VNPT Logo Placeholder - Replace with actual SVG/Image if available */}
          <div className="bg-white text-[#005A9C] font-bold text-xl px-3 py-1 rounded-md tracking-wider">
            VNPT
          </div>
          <span className="font-semibold text-lg tracking-wide">SmartFlow</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-700/50 text-white rounded-lg transition-colors border-l-4 border-white">
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors">
          <Users className="w-5 h-5" />
          <span className="font-medium">Quản lý User</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors">
          <Workflow className="w-5 h-5" />
          <span className="font-medium">Kho Quy trình</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Cấu hình AI</span>
        </a>
        
        <div className="pt-6 pb-2">
          <p className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider">
            Yêu thích
          </p>
        </div>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors">
          <Star className="w-5 h-5" />
          <span className="font-medium">Quy trình đánh dấu sao</span>
        </a>
      </nav>
      
      <div className="p-4 border-t border-blue-400">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
