import React, { useState } from "react";
import { Sparkles, Loader2, Send } from "lucide-react";

interface SidebarProps {
  onGenerate: (text: string) => void;
  loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onGenerate, loading }) => {
  const [text, setText] = useState("");

  return (
    <aside className="w-85 bg-white border-r flex flex-col shadow-xl z-20 transition-all duration-300">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#0054a6] rounded-lg shadow-blue-200 shadow-lg">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">SmartFlow AI</h2>
        </div>
        <p className="text-xs text-slate-500">
          Trực quan hóa quy trình bằng trí tuệ nhân tạo
        </p>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4">
        <label className="text-sm font-semibold text-slate-700">
          Mô tả quy trình
        </label>
        <textarea
          className="flex-1 p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#0054a6] focus:border-transparent outline-none resize-none text-sm bg-slate-50/50 transition-all shadow-inner"
          placeholder="Ví dụ: Quy trình lắp đặt mạng gồm: Tiếp nhận yêu cầu -> Khảo sát hạ tầng -> Lắp đặt thiết bị -> Nghiệm thu..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={() => onGenerate(text)}
          disabled={loading || !text.trim()}
          className={`group flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 ${
            loading
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#0054a6] to-[#0078d4] hover:shadow-blue-300 hover:brightness-110"
          }`}
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            <>
              <span>Khởi tạo quy trình</span>
              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      <div className="p-4 bg-slate-50 text-[10px] text-slate-400 border-t text-center">
        © 2026 VNPT IT - Mekong ITP Internship Project
      </div>
    </aside>
  );
};

export default Sidebar;
