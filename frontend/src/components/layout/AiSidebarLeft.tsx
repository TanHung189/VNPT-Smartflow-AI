import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  Send,
  X,
  FileUp,
  Cloud,
  ShieldCheck,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AiSidebarLeftProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (text: string, provider: "gemini" | "ollama") => void;
  onUpload: (file: File, provider: "gemini" | "ollama") => void;
  loading: boolean;
  provider: "gemini" | "ollama";
  setProvider: (provider: "gemini" | "ollama") => void;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

export const AiSidebarLeft: React.FC<AiSidebarLeftProps> = ({
  isOpen,
  onClose,
  onGenerate,
  onUpload,
  loading,
  provider,
  setProvider,
}) => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content:
        "Xin chào, tôi là trợ lý AI SmartFlow. Hãy mô tả quy trình bạn muốn tạo hoặc tải lên một văn bản quy định nhé!",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevLoading = useRef(loading);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (prevLoading.current === true && loading === false) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: "Đã thiết kế quy trình thành công!",
        },
      ]);
    }
    prevLoading.current = loading;
  }, [loading]);

  const handleSend = () => {
    if (!text.trim() || loading) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: text },
    ]);
    onGenerate(text, provider);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplateClick = (templatePrompt: string) => {
    if (loading) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: templatePrompt },
    ]);
    onGenerate(templatePrompt, provider);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="fixed left-0 top-0 h-screen w-80 lg:w-[350px] bg-white/90 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl flex flex-col z-[50]"
        >
          {/* Header */}
          <div className="h-14 border-b border-slate-100 flex justify-between items-center px-4 bg-white/40">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-tr from-[#0066cc] to-indigo-600 rounded-lg shadow-sm">
                <Bot className="text-white w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold tracking-tight text-slate-800 text-sm">
                  Smart AI Planner
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
            <button
              onClick={() => setProvider("gemini")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                provider === "gemini"
                  ? "bg-white shadow-sm border border-slate-200 text-[#0066cc]"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Cloud size={14} /> Cloud
            </button>
            <button
              onClick={() => setProvider("ollama")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                provider === "ollama"
                  ? "bg-white shadow-sm border border-slate-200 text-teal-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <ShieldCheck size={14} /> Local
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden flex flex-col gap-4 bg-transparent custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === "user" ? "self-end items-end" : "self-start items-start"
                }`}
              >
                {msg.role === "ai" && (
                  <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">
                    SmartFlow
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-[#0066cc] text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {messages.length === 1 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2 mt-4"
              >
                <p className="text-[10px] font-bold text-slate-400 mb-1 tracking-widest uppercase">
                  📌 Gợi ý nhanh
                </p>
                <button
                  onClick={() => handleTemplateClick("Vẽ sơ đồ quy trình đăng ký Cáp Quang VNPT.")}
                  className="text-left p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-blue-800 text-xs transition-colors"
                >
                  <span className="block font-bold">🌐 Cáp quang VNPT</span>
                  Tạo nhanh sơ đồ xử lý cáp quang...
                </button>
                <button
                  onClick={() => handleTemplateClick("Vẽ sơ đồ luồng xử lý sự cố viễn thông.")}
                  className="text-left p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-800 text-xs transition-colors"
                >
                  <span className="block font-bold">🔧 Hỗ trợ sự cố</span>
                  Luồng điều hành báo hỏng mạng tĩnh...
                </button>
              </motion.div>
            )}

            {loading && (
              <div className="flex flex-col self-start items-start max-w-[85%] mt-2">
                <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">SmartFlow</span>
                <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-slate-100 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#0066cc] animate-spin" />
                  <span className="text-slate-500 font-medium text-xs">Đang logic...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 pt-2 bg-white/40 border-t border-slate-200/50">
            <div className="relative flex items-end gap-2 bg-white border border-slate-300 rounded-xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-[#0066cc]/20 transition-all">
              <label className="p-2 mr-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#0066cc] cursor-pointer transition-colors">
                <FileUp size={16} />
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMessages((prev) => [
                        ...prev,
                        { id: Date.now().toString(), role: "user", content: `Load: ${file.name}` },
                      ]);
                      onUpload(file, provider);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Nhập prompt AI..."
                className="flex-1 max-h-[120px] min-h-[40px] px-2 py-2.5 bg-transparent outline-none resize-none text-sm text-slate-700"
                rows={1}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !text.trim()}
                className="p-2 mb-0.5 bg-[#0066cc] hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">SmartFlow AI có thể bị trễ phản hồi.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
