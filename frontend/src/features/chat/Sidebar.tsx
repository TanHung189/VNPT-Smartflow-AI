import React, { useState } from "react";
import { Sparkles, Loader2, Send, FileUp } from "lucide-react";

interface SidebarProps {
  onGenerate: (text: string) => void;
  onUpload: (file: File) => void;
  loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onGenerate, onUpload, loading }) => {
  const [text, setText] = useState("");

  return (
    <aside className="w-85 bg-white border-r flex flex-col shadow-xl z-20 transition-all duration-300">
      {/* Header Section */}
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

      {/* Input Section */}
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Mô tả quy trình
          </label>
          <textarea
            className="h-64 p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#0054a6] focus:border-transparent outline-none resize-none text-sm bg-slate-50/50 transition-all shadow-inner"
            placeholder="Ví dụ: Tiếp nhận yêu cầu -> Khảo sát -> Lắp đặt..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button
          onClick={() => onGenerate(text)}
          disabled={loading || !text.trim()}
          className={`group flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 ${
            loading
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#0054a6] to-[#0078d4] hover:shadow-blue-300"
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

        {/* Upload Section */}
        <div className="mt-6 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
          <div className="flex items-center gap-2 mb-3">
            <FileUp className="w-4 h-4 text-[#0054a6]" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Tải tệp quy trình
            </span>
          </div>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
            className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          <p className="mt-2 text-[10px] text-slate-400 text-center">
            Hỗ trợ: PDF, DOCX, TXT
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 text-[10px] text-slate-400 border-t text-center">
        © 2026 VNPT IT - Mekong ITP Internship Project
      </div>
    </aside>
  );
};

export default Sidebar;
