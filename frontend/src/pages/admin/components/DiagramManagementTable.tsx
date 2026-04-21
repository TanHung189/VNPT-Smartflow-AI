import React, { useEffect, useState } from "react";
import { AdminApi, AdminDiagramDTO } from "../../../services/adminApi";
import { Switch } from "../../../components/ui/switch";
import { FileImage, Loader2, Search, CheckCircle2, Palette, Save, Link } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";

export const DiagramManagementTable: React.FC = () => {
  const [diagrams, setDiagrams] = useState<AdminDiagramDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const [editingDiagram, setEditingDiagram] = useState<AdminDiagramDTO | null>(null);
  const [themeJson, setThemeJson] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchDiagrams();
  }, [debouncedSearch, page]);

  const fetchDiagrams = async () => {
    try {
      setLoading(true);
      const data = await AdminApi.getDiagrams({
        search: debouncedSearch || undefined,
        skip: (page - 1) * limit,
        limit
      });
      setDiagrams(data.items);
      setTotal(data.total);
    } catch (error) {
      // Interceptor handles the toast
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTemplate = async (diagramId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    try {
      await AdminApi.updateDiagram(diagramId, { la_mau_chuan: newVal });
      setDiagrams((prev) =>
        prev.map((d) =>
          d.id_so_do === diagramId ? { ...d, la_mau_chuan: newVal } : d
        )
      );
      toast.success(`Đã ${newVal ? "bật" : "tắt"} Mẫu chuẩn cho sơ đồ này!`);
    } catch (ex) {
      toast.error("Không thể cập nhật Mẫu chuẩn");
    }
  };

  const handleOpenThemeEditor = (diagram: AdminDiagramDTO) => {
    setEditingDiagram(diagram);
    const config = (diagram as any).du_lieu_so_do?.themeConfig || {};
    setThemeJson(JSON.stringify(config, null, 2));
  };

  const handleSaveTheme = async () => {
    if (!editingDiagram) return;
    try {
      setIsUpdating(true);
      const config = JSON.parse(themeJson);
      const duLieu = (editingDiagram as any).du_lieu_so_do || {};
      
      await AdminApi.updateDiagram(editingDiagram.id_so_do, {
        du_lieu_so_do: {
          ...duLieu,
          themeConfig: config
        }
      });
      
      toast.success("Đã cập nhật Theme cho Template!");
      setEditingDiagram(null);
      fetchDiagrams(); 
    } catch (err) {
      toast.error("Lỗi định dạng JSON hoặc kết nối server!");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#003087]">Quản lý Sơ Đồ & Mẫu Chuẩn</h2>
          <p className="text-sm text-slate-500 mt-1">Lựa chọn các sơ đồ chất lượng để làm Template cho toàn hệ thống.</p>
        </div>
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sơ đồ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="text-xs uppercase bg-slate-50/80 text-slate-500 font-bold tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Tên sơ đồ / Ảnh</th>
              <th className="px-6 py-4">Thể loại</th>
              <th className="px-6 py-4">Ngày tạo</th>
              <th className="px-6 py-4 text-center">Là mẫu chuẩn?</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0066cc]" />
                  <p className="mt-3 text-slate-500 font-medium">Đang tải dữ liệu sơ đồ...</p>
                </td>
              </tr>
            ) : diagrams.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  Không tìm thấy sơ đồ nào phù hợp.
                </td>
              </tr>
            ) : (
              Array.isArray(diagrams) && diagrams.map((diagram) => (
                <tr key={diagram.id_so_do} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {diagram.anh_thu_nho ? (
                        <img
                          src={diagram.anh_thu_nho}
                          alt={diagram.tieu_de}
                          className="w-16 h-10 rounded shadow-sm border border-slate-200 object-cover bg-white"
                        />
                      ) : (
                        <div className="w-16 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <FileImage className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-extrabold text-slate-800">{diagram.tieu_de}</p>
                        <p className="text-[11px] text-slate-400 font-mono tracking-tighter mt-0.5">{diagram.id_so_do}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                      {diagram.the_loai.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {new Date(diagram.ngay_tao).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={diagram.la_mau_chuan}
                          onCheckedChange={() => handleToggleTemplate(diagram.id_so_do, diagram.la_mau_chuan)}
                          className="data-[state=checked]:bg-[#0066cc]"
                        />
                        {diagram.la_mau_chuan && (
                          <CheckCircle2 className="w-4 h-4 text-[#0066cc] animate-pulse" />
                        )}
                      </div>
                      <button 
                        onClick={() => window.open(`/DrawDiagram?id_so_do=${diagram.id_so_do}`, '_blank')}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-all"
                        title="Xem chi tiết Canvas"
                      >
                        <Link className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenThemeEditor(diagram)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                        title="Chỉnh sửa Theme"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-white">
        <div className="text-sm text-slate-500">
          Hiển thị kết quả <span className="font-medium">{total === 0 ? 0 : (page - 1) * limit + 1}</span> - <span className="font-medium">{Math.min(page * limit, total)}</span> trong tổng số <span className="font-medium">{total}</span>
        </div>
        <div className="flex gap-2">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)} 
            className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Trước
          </button>
          <button 
            disabled={page * limit >= total} 
            onClick={() => setPage(page + 1)} 
            className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Sau
          </button>
        </div>
      </div>

      {/* Theme Editor Dialog */}
      <Dialog open={!!editingDiagram} onOpenChange={(open: boolean) => !open && setEditingDiagram(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-500" />
              Cấu hình Theme Template
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4">
              Nhập cấu hình JSON để ghi đè style cho các Node trong template này (màu sắc, viền, icon...).
            </p>
            <Textarea
              value={themeJson}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setThemeJson(e.target.value)}
              placeholder='{ "process": { "header": "from-indigo-500 to-blue-600" } }'
              className="h-64 font-mono text-sm border-slate-200"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDiagram(null)}>Hủy</Button>
            <Button 
              onClick={handleSaveTheme} 
              disabled={isUpdating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Lưu Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
