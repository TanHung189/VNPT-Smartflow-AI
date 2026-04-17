import React, { useEffect, useState } from "react";
import { AdminApi, AiModelDTO } from "../../../services/adminApi";
import { Loader2, Plus, Server, Cloud, Cpu, Trash2, Edit2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../../components/ui/badge";
import { Switch } from "../../../components/ui/switch";

export const AiModelManagement: React.FC = () => {
  const [models, setModels] = useState<AiModelDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AiModelDTO | null>(null);
  const [formData, setFormData] = useState<AiModelDTO>({
    nha_cung_cap: "ollama",
    ten_mo_hinh: "",
    mo_ta: "",
    trang_thai_hoat_dong: true,
  });

  const fetchModels = async () => {
    try {
      setLoading(true);
      const data = await AdminApi.getAiModels();
      setModels(data);
    } catch (e) {
      toast.error("Không thể tải danh sách Model");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleToggleStatus = async (id: number, currentStatus: boolean, modelData: AiModelDTO) => {
    try {
      const payload = { ...modelData, trang_thai_hoat_dong: !currentStatus };
      await AdminApi.updateAiModel(id, payload);
      setModels((prev) => prev.map((m) => (m.id_mo_hinh === id ? payload : m)));
      toast.success(`Đã ${!currentStatus ? "kích hoạt" : "tạm dừng"} model!`);
    } catch (e) {
      toast.error("Không thể thay đổi trạng thái!");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Model này vĩnh viễn?")) return;
    try {
      await AdminApi.deleteAiModel(id);
      setModels((prev) => prev.filter((m) => m.id_mo_hinh !== id));
      toast.success("Đã xóa model thành công");
    } catch (e) {
      toast.error("Khong thể xóa model này");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ten_mo_hinh) {
      toast.warning("Vui lòng nhập tên model!");
      return;
    }

    try {
      if (editingModel && editingModel.id_mo_hinh) {
        const updated = await AdminApi.updateAiModel(editingModel.id_mo_hinh, formData);
        setModels((prev) => prev.map((m) => (m.id_mo_hinh === updated.id_mo_hinh ? updated : m)));
        toast.success("Đã cập nhật model!");
      } else {
        const created = await AdminApi.createAiModel(formData);
        setModels((prev) => [created, ...prev]);
        toast.success("Đã thêm model mới!");
      }
      setIsDialogOpen(false);
    } catch (ex) {
      toast.error("Có lỗi xảy ra khi lưu Model!");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-transparent">
        <div>
          <h2 className="text-xl font-extrabold text-[#003087] flex items-center gap-2">
            <Cpu className="w-5 h-5" /> Quản lý Mô hình AI
          </h2>
          <p className="text-sm text-slate-500 mt-1">Cấu hình các Model AI (LLMs) được phép hoạt động trên hệ thống (Cloud & Local).</p>
        </div>
        <button
          onClick={() => {
            setEditingModel(null);
            setFormData({ nha_cung_cap: "gemini", ten_mo_hinh: "", mo_ta: "", trang_thai_hoat_dong: true });
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2 bg-[#0066cc] hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm Model
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#0066cc]" />
          <p>Đang đồng bộ Models từ DB...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
          {models.map((model) => (
            <div
              key={model.id_mo_hinh}
              className={`relative bg-white rounded-xl border-2 p-5 shadow-sm transition-all duration-300 ${
                model.trang_thai_hoat_dong ? "border-blue-100 hover:shadow-md hover:border-blue-300" : "border-slate-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
              }`}
            >
              {/* Header Box */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg shadow-sm ${model.nha_cung_cap === "gemini" ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"}`}>
                    {model.nha_cung_cap === "gemini" ? <Cloud className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{model.ten_mo_hinh}</h3>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      PROVIDER: {model.nha_cung_cap}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-500 mb-5 min-h-[40px] line-clamp-2">
                {model.mo_ta || "Chưa có mô tả cấu hình."}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                {/* Status Toggle */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggleStatus(model.id_mo_hinh!, model.trang_thai_hoat_dong, model)}>
                  <Switch checked={model.trang_thai_hoat_dong} />
                  <span className={`text-xs font-bold ${model.trang_thai_hoat_dong ? "text-[#0066cc]" : "text-slate-400"}`}>
                    {model.trang_thai_hoat_dong ? "Đang chạy" : "Tạm dừng"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingModel(model);
                      setFormData(model);
                      setIsDialogOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(model.id_mo_hinh!)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tailwind & Dialog Based Custom Modal (Absolute Z-Index fix) */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-extrabold text-lg text-slate-800">
                {editingModel ? "Cấu hình Model AI" : "Đăng ký Model Mới"}
              </h3>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nhà cung cấp (Provider)</label>
                <select
                  value={formData.nha_cung_cap}
                  onChange={(e) => setFormData({ ...formData, nha_cung_cap: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="gemini">Google Cloud (Gemini)</option>
                  <option value="ollama">Local Server (Ollama)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên mô hình chính xác (Model ID)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: gemini-1.5-pro, qwen2.5-coder:7b"
                  value={formData.ten_mo_hinh}
                  onChange={(e) => setFormData({ ...formData, ten_mo_hinh: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả tóm tắt</label>
                <textarea
                  rows={3}
                  placeholder="Ứng dụng xử lý quy trình iOffice..."
                  value={formData.mo_ta || ""}
                  onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Switch 
                  checked={formData.trang_thai_hoat_dong} 
                  onCheckedChange={(val) => setFormData({ ...formData, trang_thai_hoat_dong: val })}
                />
                <span className="text-sm font-bold text-slate-700">Kích hoạt sẵn sàng cho User</span>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#003087] hover:bg-blue-800 text-white rounded-lg font-bold shadow-md transition-colors"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
