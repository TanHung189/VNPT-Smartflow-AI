import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Sparkles,
  Loader2,
  Send,
  X,
  FileUp,
  Cloud,
  ShieldCheck,
  Bot,
  Server,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getDiagramConfig, DIAGRAM_CONFIGS, type SamplePrompt } from "../../features/flow/diagramConfig";
import { AdminApi, AiModelDTO } from "../../services/adminApi";

interface ReactFlowAIPayload {
  success: boolean;
  errorMsg?: string;
}

interface AiSidebarLeftProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (text: string, provider: string) => Promise<ReactFlowAIPayload>;
  onUpload: (file: File, provider: string) => Promise<boolean>;
  loading: boolean;
  provider: string;
  setProvider: (provider: string) => void;
  /** Context-Aware: Loại sơ đồ hiện tại từ bảng so_do.the_loai */
  diagramType?: string;
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
  diagramType = "process",
}) => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showPrompts, setShowPrompts] = useState(true);
  const [activeModels, setActiveModels] = useState<AiModelDTO[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false); // Global Theme state for Chatbot
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic Theme Mapping
  const theme = {
    bg: isDark ? "bg-slate-900" : "bg-white/95",
    textObj: isDark ? "text-slate-100" : "text-slate-800",
    border: isDark ? "border-slate-800" : "border-slate-200/50",
    bubbleAI: isDark ? "bg-slate-800 text-slate-100 border-slate-700" : "bg-slate-100/80 text-slate-800 border-slate-200/70",
    inputBox: isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200",
    textInput: isDark ? "text-white placeholder:text-slate-500" : "text-slate-700 placeholder:text-slate-300",
  };

  // Get context-aware config for current diagram type
  const cfg = useMemo(() => getDiagramConfig(diagramType), [diagramType]);

  useEffect(() => {
    // Fetch live models
    AdminApi.getAiModels().then((res) => {
      // Handle potential backend wrapper `{ data: [...] }` vs direct array `[...]`
      const dataArray = Array.isArray(res) ? res : ((res as any).data || (res as any).items || []);
      const active = dataArray.filter((m: AiModelDTO) => m.trang_thai_hoat_dong);
      setActiveModels(active);
      setIsModelsLoading(false);
      // Auto select the first one if current provider is obsolete or standard
      if (active.length > 0 && provider === "gemini") {
        setProvider(active[0].ten_mo_hinh);
      }
    }).catch(e => {
       console.error("Failed to load AI Models:", e);
       setIsModelsLoading(false);
    });
  }, []);

  // Build welcome message based on diagram type
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "ai",
        content: `Xin chào! Tôi là **${cfg.aiRole}**.\nHãy mô tả sơ đồ bạn muốn tạo, hoặc chọn một mẫu có sẵn bên dưới.`,
      },
    ]);
    setShowPrompts(true);
  }, [diagramType, cfg.aiRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);



  const handleSend = async () => {
    if (!text.trim() || loading) return;
    const currentText = text;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: currentText },
    ]);
    setShowPrompts(false);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    
    const result = await onGenerate(currentText, provider);
    if (result.success) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: "✅ Đã phân tích JSON và tự động vẽ sơ đồ lên Canvas! Bạn có thể chỉnh sửa trực tiếp hoặc yêu cầu tôi điều chỉnh.",
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: `❌ ${result.errorMsg || "Lỗi tạo sơ đồ."}`,
        },
      ]);
      setShowPrompts(true); // Bring back samples for recovery
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSampleClick = async (sample: SamplePrompt) => {
    if (loading) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: sample.title },
    ]);
    setShowPrompts(false);
    const result = await onGenerate(sample.prompt, provider);
    if (result.success) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: "✅ Sơ đồ từ mẫu đang được tự động render lên Canvas!",
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: `❌ Không thể thiết lập mẫu: ${result.errorMsg}`,
        },
      ]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className={`fixed left-0 top-0 h-screen w-80 lg:w-[360px] ${theme.bg} backdrop-blur-xl border-r ${theme.border} shadow-2xl flex flex-col z-[50] transition-colors duration-300`}
        >
          {/* ─── HEADER ─── */}
          <div className="h-14 border-b border-slate-100 flex justify-between items-center px-4 bg-transparent">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-tr from-[#003087] to-[#0066cc] rounded-lg shadow-sm">
                <Bot className="text-white w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-extrabold tracking-tight text-sm leading-none ${theme.textObj}`}>
                  SmartFlow AI
                </h3>
                <p className={`text-[10px] font-semibold mt-0.5 ${cfg.color}`}>
                  {cfg.icon} {cfg.aiRole}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-1.5 rounded-lg transition-colors text-xs font-bold ${isDark ? "bg-slate-800 text-yellow-400" : "bg-slate-100 text-slate-500"}`}
              >
                {isDark ? "🌙" : "☀️"}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200/50 text-slate-400 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── DYNAMIC PROVIDER TOGGLE ─── */}
          <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
            {isModelsLoading ? (
              <span className="text-xs text-slate-400">Loading models...</span>
            ) : activeModels.length === 0 ? (
              <span className="text-xs text-slate-400">Không có model nào</span>
            ) : (
              activeModels.map((m) => (
                <button
                  key={m.id_mo_hinh || m.ten_mo_hinh}
                  onClick={() => setProvider(m.ten_mo_hinh)}
                  className={`flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    provider === m.ten_mo_hinh
                      ? m.nha_cung_cap === "gemini" 
                        ? "bg-white shadow-sm border border-blue-200 text-[#0066cc]" 
                        : "bg-white shadow-sm border border-teal-200 text-teal-600"
                      : "text-slate-500 border border-transparent hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {m.nha_cung_cap === "gemini" ? <Cloud size={13} /> : <Server size={13} />} 
                  {m.ten_mo_hinh}
                </button>
              ))
            )}
          </div>

          {/* ─── MESSAGES BODY ─── */}
          <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden flex flex-col gap-3 bg-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[88%] ${
                  msg.role === "user" ? "self-end items-end" : "self-start items-start"
                }`}
              >
                {msg.role === "ai" && (
                  <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">
                    SmartFlow
                  </span>
                )}
                <div
                  className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-[#003087] to-[#0066cc] text-white rounded-br-sm shadow-md"
                      : `${theme.bubbleAI} rounded-bl-sm border`
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* ─── CONTEXT-AWARE SAMPLE PROMPTS ─── */}
            {showPrompts && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2 mt-2"
              >
                {/* Section header */}
                <button
                  onClick={() => setShowPrompts((v) => !v)}
                  className={`flex items-center justify-between w-full text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg ${cfg.bgColor} ${cfg.color} border ${cfg.borderColor} transition-colors`}
                >
                  <span className="flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3" />
                    {cfg.icon} Quick Actions — {cfg.label}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Sample prompt buttons */}
                {cfg.samplePrompts.map((sample, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSampleClick(sample)}
                    disabled={loading}
                    className={`text-left p-3 rounded-xl border shadow-sm transition-all duration-200 group disabled:opacity-50 ${cfg.bgColor} ${cfg.borderColor} hover:shadow-md hover:scale-[1.01]`}
                  >
                    <span className={`block font-bold text-xs mb-0.5 ${cfg.color} group-hover:underline`}>
                      {sample.title}
                    </span>
                    <span className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {sample.prompt.substring(0, 80)}...
                    </span>
                  </motion.button>
                ))}

                {/* Separator + other diagram types */}
                <div className="mt-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-1">
                    Loại sơ đồ khác
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(DIAGRAM_CONFIGS)
                      .filter(([key]) => key !== diagramType)
                      .map(([key, c]) => (
                        <span
                          key={key}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${c.bgColor} ${c.borderColor} ${c.color}`}
                        >
                          {c.icon} {c.label}
                        </span>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI Thinking indicator */}
            {loading && (
              <div className="flex flex-col self-start items-start mt-2">
                <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">
                  SmartFlow
                </span>
                <div
                  className={`px-3 py-2 rounded-2xl rounded-bl-sm ${theme.bubbleAI} border flex items-center h-[34px]`}
                >
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-[#0066cc] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#0066cc] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#0066cc] rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-[11px] ml-3 text-[#0066cc] font-semibold italic">
                    AI đang trích xuất JSON...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── CHAT INPUT ─── */}
          <div className={`p-3 pt-2 bg-transparent border-t ${theme.border}`}>
            <div className={`relative flex items-end gap-2 ${theme.inputBox} border rounded-xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-[#0066cc]/30 transition-all`}>
              <label className="p-2 hover:bg-slate-400/20 rounded-lg text-slate-400 hover:text-[#0066cc] cursor-pointer transition-colors">
                <FileUp size={15} />
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMessages((prev) => [
                        ...prev,
                        { id: Date.now().toString(), role: "user", content: `📎 ${file.name}` },
                      ]);
                      setShowPrompts(false);
                      const success = await onUpload(file, provider);
                      if (success) {
                        setMessages((prev) => [
                          ...prev,
                          { id: Date.now().toString(), role: "ai", content: "✅ Đã phân tích nội dung file, tự động layout sơ đồ hoàn tất!" },
                        ]);
                      }
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
                placeholder={cfg.placeholderInfo || `Mô tả ${cfg.label.toLowerCase()}...`}
                className={`flex-1 max-h-[120px] min-h-[40px] px-2 py-2.5 bg-transparent outline-none resize-none text-sm ${theme.textInput}`}
                rows={1}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !text.trim()}
                className="p-2 mb-0.5 bg-gradient-to-br from-[#003087] to-[#0066cc] hover:from-[#002570] hover:to-blue-700 text-white rounded-lg disabled:opacity-40 flex items-center justify-center shrink-0 shadow-md transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
              Mode: {provider} • <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
