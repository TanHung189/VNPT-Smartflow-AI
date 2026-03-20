import React, { useState } from "react"; // tạo component + useState để lưu dữ liệu trong component
import {
  Sparkles,
  Loader2,
  Send,
  FileUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"; // lucide-react là thư viên icon

//dđịnh nghĩa kiểu dữ liệu props
interface SidebarProps {
  onGenerate: (text: string) => void;
  onUpload: (file: File) => void;
  loading: boolean;
}

const onDragStart = (event: React.DragEvent, nodeType: string) => {
  event.dataTransfer.setData("application/reactflow", nodeType);
  event.dataTransfer.effectAllowed = "move";
};

const Sidebar: React.FC<SidebarProps> = ({ onGenerate, onUpload, loading }) => {
  const [text, setText] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="relative flex h-full">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-6 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
      <aside
        className={`bg-white border-r border-slate-100 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? "w-0 opacity-0" : "w-85 opacity-100"
        }`}
      >
        {/* Header Section - Giữ nguyên phong cách đa màu sắc */}
        <div className="p-6 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-transparent flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-slate-800 tracking-tight">
            SMARTFLOW <span className="text-blue-600">AI</span>
          </span>
        </div>

        {/* Input Section */}
        <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Mô tả quy trình
            </label>
            <textarea
              className="h-64 p-4 border border-slate-200 rounded-[20px] focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none resize-none text-sm bg-slate-50/50 transition-all shadow-inner"
              placeholder="Nhập các bước nghiệp vụ tại đây..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <button
            onClick={() => onGenerate(text)}
            disabled={loading || !text.trim()}
            className={`group flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white transition-all shadow-xl active:scale-95 ${
              loading
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200"
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

          {/* Upload Section - Phối màu Amber cho sinh động */}
          <div className="mt-4 p-5 border-2 border-dashed border-amber-100 rounded-3xl bg-amber-50/30 group hover:border-amber-300 transition-colors">
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <FileUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Tải văn bản quy định
              </span>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
              className="block w-full text-[10px] text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 text-[9px] font-bold text-slate-400 border-t text-center tracking-tighter italic">
          © 2026 VNPT IT - MEKONG ITP INTERNSHIP PROJECT
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
