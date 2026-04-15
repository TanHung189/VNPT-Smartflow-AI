import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  Send,
  X,
  FileUp,
  Cloud,
  ShieldCheck,
  MessageSquare,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../components/ui/card";

interface SidebarProps {
  onGenerate: (text: string, provider: "gemini" | "ollama") => void;
  onUpload: (file: File, provider: "gemini" | "ollama") => void;
  loading: boolean;
  provider: "gemini" | "ollama";
  setProvider: (provider: "gemini" | "ollama") => void;
  onSave: () => void;
  onOpenLibrary: () => void;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  onGenerate,
  onUpload,
  loading,
  provider,
  setProvider,
  onSave,
  onOpenLibrary,
}) => {
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
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

  // Automatically scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Add AI response when loading finishes
  useEffect(() => {
    if (prevLoading.current === true && loading === false) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: "Đã tạo/cập nhật biểu đồ thành công!",
        },
      ]);
    }
    prevLoading.current = loading;
  }, [loading]);

  const handleSend = () => {
    if (!text.trim() || loading) return;

    // Thêm tin nhắn của User
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: text },
    ]);

    // Gọi hàm sinh biểu đồ
    onGenerate(text, provider);

    // Xóa input
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize logic
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  const handleTemplateClick = (templatePrompt: string) => {
    if (loading) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: templatePrompt },
    ]);
    onGenerate(templatePrompt, provider);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="relative font-sans text-sm">
      {/* ─── NÚT TRÒ TRÒN KHI THU GỌN (TOGGLE BUTTON) ─── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 right-0"
          >
            <div className="relative group">
              <button
                onClick={() => setIsOpen(true)}
                className="w-14 h-14 bg-gradient-to-r from-[#0066cc] to-[#004b91] hover:from-blue-500 hover:to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-6 h-6" />
              </button>
              {/* Tooltip đơn giản */}
              <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl">
                Chat với AI Assistant
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-800 rotate-45"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── KHUNG CHATBOX MỞ RỘNG ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-0 right-0 origin-bottom-right"
          >
            <Card className="w-[360px] sm:w-[400px] h-[600px] flex flex-col bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/40 dark:bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-tr from-[#0066cc] to-[#004b91] rounded-xl shadow-md">
                    <Bot className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold tracking-tight text-slate-800 dark:text-slate-100">
                      AI Assistant
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                        Online
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tùy chọn Model / Tùy chọn khác nằm mỏng phía dưới Header */}
              <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setProvider("gemini")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                    provider === "gemini"
                      ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-[#0066cc]"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <Cloud size={14} /> Cloud (Gemini)
                </button>
                <button
                  onClick={() => setProvider("ollama")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                    provider === "ollama"
                      ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-teal-600"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <ShieldCheck size={14} /> Local (Bảo mật)
                </button>
              </div>

              {/* Body (ScrollArea) */}
              <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden flex flex-col gap-4 bg-transparent custom-scrollbar">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === "user"
                        ? "self-end items-end"
                        : "self-start items-start"
                    }`}
                  >
                    {msg.role === "ai" && (
                      <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">
                        SmartFlow AI
                      </span>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-[#0066cc] text-white rounded-br-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* ─── TEMPLATES KHỞI TẠO NHANH (HIỂN THỊ KHI CHƯA CHAT) ─── */}
                {messages.length === 1 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col gap-2 mt-4 px-1"
                  >
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest pl-1">
                      📌 Mẫu quy trình (VNPT Demo)
                    </p>

                    <button
                      onClick={() =>
                        handleTemplateClick(
                          "Quy trình Đăng ký dịch vụ Internet Cáp quang VNPT: 1. Khách hàng yêu cầu đăng ký qua tổng đài hoặc website. 2. Tư vấn viên tiếp nhận và khảo sát hạ tầng tĩnh. 3. Nếu hạ tầng không đạt, thông báo từ chối. Nếu hạ tầng đạt, chuyển thông tin đến bộ phận kỹ thuật. 4. Kỹ thuật viên xuống tận nơi khảo sát thực tế và kéo cáp. 5. Lắp đặt nghiệm thu, sau đó ký biên bản và bàn giao cho khách hàng sử dụng.",
                        )
                      }
                      className="text-left p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 hover:border-blue-300 text-blue-800 text-xs transition-all hover:-translate-y-0.5 shadow-sm group"
                    >
                      <span className="block font-bold mb-1 group-hover:text-blue-900">
                        🌐 Đăng ký Internet Cáp quang
                      </span>
                      Mô tả quy trình tư vấn và lắp đặt cáp quang cho khách hàng
                      cá nhân.
                    </button>

                    <button
                      onClick={() =>
                        handleTemplateClick(
                          "Quy trình Hỗ trợ xử lý sự cố Viễn Thông: 1. Khách hàng báo hỏng dịch vụ qua tổng đài 18001166. 2. Hệ thống tổng đài tự động tạo ticket và gửi về hệ thống NetOS quản lý lỗi. 3. AI phân tích lỗi tự động, nếu tự động fix được thì xử lý ngay và đóng ticket. 4. Nếu không fix được, điều động nhân sự kỹ thuật địa bàn (VNPT Tỉnh/TP) đến tận nơi. 5. Kỹ thuật viên xử lý, xác nhận KH và đóng ticket trên app My VNPT.",
                        )
                      }
                      className="text-left p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 hover:border-emerald-300 text-emerald-800 text-xs transition-all hover:-translate-y-0.5 shadow-sm group"
                    >
                      <span className="block font-bold mb-1 group-hover:text-emerald-900">
                        🔧 Hỗ trợ xử lý sự cố
                      </span>
                      Quy trình điều hành xử lý báo hỏng mạng tĩnh qua
                      SmartFlow/NetOS.
                    </button>

                    <button
                      onClick={() =>
                        handleTemplateClick(
                          "Quy trình Mở rộng hạ tầng OLT VNPT: 1. Phòng Kỹ thuật lập kế hoạch phát triển hạ tầng OLT. 2. Trình Ban Giám Đốc phê duyệt ngân sách. 3. Nếu không duyệt, hủy yêu cầu; nếu duyệt, gửi phòng mua sắm. 4. Đấu thầu và mua thiết bị OLT. 5. Thi công lắp đặt tại trạm viễn thông. 6. Cấu hình tích hợp lên hệ thống giám sát GNOC và hoàn thành dự án.",
                        )
                      }
                      className="text-left p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 hover:border-indigo-300 text-indigo-800 text-xs transition-all hover:-translate-y-0.5 shadow-sm group"
                    >
                      <span className="block font-bold mb-1 group-hover:text-indigo-900">
                        🏗️ Triển khai hạ tầng OLT
                      </span>
                      Cấu trúc quy trình phê duyệt đấu thầu và lắp đặt Core
                      Network.
                    </button>
                  </motion.div>
                )}

                {loading && (
                  <div className="flex flex-col self-start items-start max-w-[85%] mt-2">
                    <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">
                      SmartFlow AI
                    </span>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-[#0066cc] animate-spin" />
                      <span className="text-slate-500 font-medium">
                        Đang suy nghĩ...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions / Cấu hình phụ */}
              <div className="px-4 py-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="relative group cursor-pointer">
                  <label className="flex items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer text-slate-500 transition-colors shadow-sm">
                    <FileUp size={16} />
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setMessages((prev) => [
                            ...prev,
                            {
                              id: Date.now().toString(),
                              role: "user",
                              content: `Đã đính kèm file: ${file.name}`,
                            },
                          ]);
                          onUpload(file, provider);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1" />

                {/* Các nút lưu & thư viện cũ cho vào icon nhỏ */}
                <button
                  onClick={onSave}
                  title="Lưu sơ đồ"
                  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-bold text-xs flex items-center gap-1 border border-blue-200 shadow-sm"
                >
                  Lưu sơ đồ
                </button>
              </div>

              {/* Footer Input */}
              <div className="p-4 pt-2 bg-white/40 dark:bg-slate-900/40">
                <div className="relative flex items-end gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-[#0066cc]/20 focus-within:border-[#0066cc] transition-all">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Mô tả quy trình muốn vẽ..."
                    className="flex-1 max-h-[150px] min-h-[40px] px-3 py-2.5 bg-transparent outline-none resize-none disabled:opacity-50 text-slate-700 dark:text-slate-200"
                    rows={1}
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !text.trim()}
                    className="p-2 mb-1 mr-1 h-fit bg-[#0066cc] hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors disabled:bg-slate-200 disabled:text-slate-400 flex-shrink-0 flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center mt-2">
                  <p className="text-[10px] text-slate-400 font-medium">
                    SmartFlow AI có thể mắc lỗi. Vui lòng kiểm tra lại sơ đồ.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
