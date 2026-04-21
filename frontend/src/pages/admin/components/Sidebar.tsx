import React from 'react';
import { LayoutDashboard, Users, Workflow, Settings, Star, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Quản lý User', icon: Users },
    { id: 'diagrams', label: 'Kho Quy trình', icon: Workflow },
    { id: 'ai-config', label: 'Cấu hình AI', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0066b3] text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto shadow-xl z-20">
      <div className="flex items-center justify-center h-20 border-b border-blue-400">
        <div className="flex items-center gap-3">
          <div className="bg-white text-[#0066b3] font-bold text-xl px-3 py-1 rounded-md tracking-wider">
            VNPT
          </div>
          <span className="font-semibold text-lg tracking-wide">SmartFlow</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-700/50 text-white border-l-4 border-white font-semibold' 
                  : 'text-blue-100 hover:bg-blue-700/50 hover:text-white font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
        
        <div className="pt-6 pb-2">
          <p className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider">
            Yêu thích
          </p>
        </div>
        <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors">
          <Star className="w-5 h-5" />
          <span className="font-medium">Quy trình đánh dấu sao</span>
        </button>
      </nav>
      
      <div className="p-4 border-t border-blue-400">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-blue-100 hover:bg-blue-700/50 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
