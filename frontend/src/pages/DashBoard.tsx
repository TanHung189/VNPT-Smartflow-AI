import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { diagramApi, DiagramListItem } from "../services/diagramApi";
import { toast } from "sonner";
import {
  Plus,
  MoreVertical,
  LayoutGrid,
  List,
  FolderOpen,
  Sparkles,
  FileBox,
  Pencil,
  Trash
} from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../components/ui/alert-dialog";

const templates = [
  {
    id: "blank",
    name: "Trắng (Từ đầu)",
    icon: <Plus className="w-8 h-8 text-slate-400" />,
  },
  { id: "ai", name: "Smart AI Playground", isAi: true },
  { id: "org-chart", name: "Sơ đồ Tổ chức (HR)", color: "bg-orange-100" },
  { id: "ioffice", name: "Quy trình iOffice", color: "bg-emerald-100" },
  { id: "layered", name: "Kiến trúc Phân tầng", color: "bg-blue-100" },
  { id: "mindmap", name: "Sơ đồ Tư duy (Mindmap)", color: "bg-amber-100" },
  { id: "uml", name: "Sơ đồ Phần mềm (UML)", color: "bg-purple-100" },
];

export const DashBoard: React.FC = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [diagrams, setDiagrams] = useState<DiagramListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // States cho modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameData, setRenameData] = useState<{ id: string; title: string; mo_ta_ngan?: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // ─────────────────── AUTO-POLLING API ───────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchDiagrams = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await diagramApi.getAll(token);
        if (isMounted) {
          const dataArray = Array.isArray(data) ? data : ((data as any).data || (data as any).items || []);
          setDiagrams(dataArray);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    };

    // Initial fetch
    fetchDiagrams();

    // Setup polling every 30s as per Miro-style Realtime Data
    const interval = setInterval(fetchDiagrams, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ─────────────────── DATE GROUPING ───────────────────
  const groupedDiagrams = useMemo(() => {
    const today: DiagramListItem[] = [];
    const yesterday: DiagramListItem[] = [];
    const thisWeek: DiagramListItem[] = [];
    const older: DiagramListItem[] = [];

    diagrams.forEach((d) => {
      const date = new Date(d.ngay_cap_nhat);
      if (isToday(date)) today.push(d);
      else if (isYesterday(date)) yesterday.push(d);
      else if (isThisWeek(date)) thisWeek.push(d);
      else older.push(d);
    });
    return { today, yesterday, thisWeek, older };
  }, [diagrams]);

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      await diagramApi.delete(deleteId, token);
      toast.success("Đã chuyển vào thùng rác!");
      
      const data = await diagramApi.getAll(token);
      setDiagrams(Array.isArray(data) ? data : ((data as any).data || (data as any).items || []));
    } catch (error) {
      // lỗi đã báo
    } finally {
      setIsSaving(false);
      setDeleteId(null);
    }
  };

  const executeRename = async () => {
    if (!renameData || !newTitle.trim() || newTitle === renameData.title) {
        setRenameData(null);
        return;
    }
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const currentDiagram = await diagramApi.getById(renameData.id, token);
      const originalInfo = diagrams.find(d => d.id_so_do === renameData.id);
      
      await diagramApi.update(renameData.id, {
          tieu_de: newTitle.trim(),
          du_lieu_so_do: currentDiagram.du_lieu_so_do as any,
          the_loai: originalInfo?.the_loai,
          la_noi_bo: currentDiagram.la_noi_bo,
          mo_ta_ngan: newDesc.trim() || undefined
      }, token);
      toast.success("Cập nhật thông tin thành công!");
      const data = await diagramApi.getAll(token);
      setDiagrams(Array.isArray(data) ? data : ((data as any).data || (data as any).items || []));
    } catch (error) {
       toast.error("Có lỗi xảy ra khi đổi tên.");
    } finally {
      setIsSaving(false);
      setRenameData(null);
      setNewTitle("");
      setNewDesc("");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]"></div>
      </div>
    );
  }

  const renderGroup = (title: string, list: DiagramListItem[]) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-800 mb-4 ml-1">{title}</h3>

        {viewMode === "grid" ? (
          // ─── GIAO DIỆN GRID (CŨ) ───
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {list.map((d) => (
              <div
                key={d.id_so_do}
                onClick={() => navigate(`/DrawDiagram?id=${d.id_so_do}`)}
                className="group cursor-pointer flex flex-col bg-white p-3 border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300"
              >
                <div className="h-32 bg-slate-50 border border-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                  <FileBox className="absolute inset-0 m-auto w-8 h-8 text-slate-300 z-0" />
                  <img
                    src={`${process.env.REACT_APP_API_BASE_URL}/diagrams/${d.id_so_do}/thumbnail`}
                    alt={d.tieu_de}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="relative z-10 w-full h-full object-contain p-2 bg-white mix-blend-multiply opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                  />
                  {d.la_noi_bo && (
                    <div className="absolute top-2 left-2 z-20 bg-teal-100/90 text-teal-800 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm border border-teal-200/50 flex flex-center gap-1">
                      LOCAL AI
                    </div>
                  )}
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="absolute top-2 right-2 p-1.5 bg-white/90 shadow-sm rounded border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 text-slate-600">
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg border border-slate-200 rounded-lg py-1 p-0">
                          <DropdownMenuItem 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/DrawDiagram?id=${d.id_so_do}`);
                              }}
                              className="text-[13px] text-slate-700 py-2 px-3 hover:bg-slate-50 cursor-pointer flex items-center focus:bg-slate-50"
                          >
                              Mở sơ đồ
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameData({ id: d.id_so_do, title: d.tieu_de, mo_ta_ngan: d.mo_ta_ngan });
                                  setNewTitle(d.tieu_de);
                                  setNewDesc(d.mo_ta_ngan || "");
                              }}
                              className="text-[13px] text-slate-700 py-2 px-3 hover:bg-slate-50 cursor-pointer flex items-center focus:bg-slate-50"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-2 text-slate-400" /> Đổi tên
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100 my-1" />
                          <DropdownMenuItem 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(d.id_so_do);
                              }}
                              className="text-[13px] text-red-600 py-2 px-3 hover:bg-red-50 cursor-pointer flex items-center font-medium focus:bg-red-50 focus:text-red-700"
                          >
                              <Trash className="w-3.5 h-3.5 mr-2" /> Chuyển vào thùng rác
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="px-1 pb-1">
                  <p className="text-sm font-bold text-slate-800 truncate mb-1">
                    {d.tieu_de}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    Đã sửa: {format(new Date(d.ngay_cap_nhat), "HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>

        ) : (
          // ─── GIAO DIỆN LIST (MỚI) ───
          <div className="flex flex-col gap-2">
            {list.map((d) => (
              <div
                key={d.id_so_do}
                onClick={() => navigate(`/DrawDiagram?id=${d.id_so_do}`)}
                className="group cursor-pointer flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail nhỏ xíu */}
                  <div className="w-20 h-14 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 relative">
                    <FileBox className="absolute inset-0 m-auto w-5 h-5 text-slate-300 z-0" />
                    <img
                      src={`${process.env.REACT_APP_API_BASE_URL}/diagrams/${d.id_so_do}/thumbnail`}
                      alt={d.tieu_de}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="relative z-10 w-full h-full object-contain bg-white mix-blend-multiply"
                    />
                  </div>

                  {/* Thông tin Text */}
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-[#0066cc] transition-colors">
                      {d.tieu_de}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500 font-medium">
                        Đã sửa: {format(new Date(d.ngay_cap_nhat), "HH:mm")}
                      </p>
                      {d.la_noi_bo && (
                        <span className="bg-teal-100 text-teal-800 text-[9px] font-bold px-1.5 py-[1px] rounded">
                          LOCAL AI
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg border border-slate-200 rounded-lg py-1 p-0">
                          <DropdownMenuItem 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/DrawDiagram?id=${d.id_so_do}`);
                              }}
                              className="text-[13px] text-slate-700 py-2 px-3 hover:bg-slate-50 cursor-pointer flex items-center focus:bg-slate-50"
                          >
                              Mở sơ đồ
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameData({ id: d.id_so_do, title: d.tieu_de, mo_ta_ngan: d.mo_ta_ngan });
                                  setNewTitle(d.tieu_de);
                                  setNewDesc(d.mo_ta_ngan || "");
                              }}
                              className="text-[13px] text-slate-700 py-2 px-3 hover:bg-slate-50 cursor-pointer flex items-center focus:bg-slate-50"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-2 text-slate-400" /> Đổi tên
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100 my-1" />
                          <DropdownMenuItem 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(d.id_so_do);
                              }}
                              className="text-[13px] text-red-600 py-2 px-3 hover:bg-red-50 cursor-pointer flex items-center font-medium focus:bg-red-50 focus:text-red-700"
                          >
                              <Trash className="w-3.5 h-3.5 mr-2" /> Chuyển vào thùng rác
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout activeTab="Home">
        <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 lg:px-12 xl:px-16 space-y-10">
          {/* Templates Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Enterprise Templates by VNPT
              </h2>
              <button className="text-sm font-bold text-[#0066cc] hover:text-blue-800 transition-colors">
                Tất cả mẫu
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex-shrink-0 w-48 group">
                  <div
                    onClick={() => navigate(`/DrawDiagram?template=${tpl.id}`)}
                    className={`h-32 border border-slate-200 rounded-2xl mb-3 flex items-center justify-center cursor-pointer transition-all ${
                      tpl.id === "blank"
                        ? "bg-white border-dashed hover:border-[#0066cc] hover:bg-blue-50/30"
                        : tpl.isAi
                          ? "bg-gradient-to-tr from-slate-900 to-slate-800 border-none hover:shadow-lg hover:shadow-slate-900/20 relative overflow-hidden"
                          : `${tpl.color || "bg-white"} hover:opacity-90`
                    }`}
                  >
                    {tpl.icon && tpl.icon}
                    {tpl.isAi && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse mb-2" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 text-center flex items-center justify-center gap-1.5 tracking-tight">
                    {tpl.isAi && (
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                    )}
                    {tpl.name}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Boards Section */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4 border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                VNPT Workspace
              </h2>
              {/* ─── NÚT TOGGLE GRID / LIST ─── */}
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-800"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-800"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]"></div>
              </div>
            ) : diagrams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 border-dashed rounded-3xl shrink-0">
                <FolderOpen className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-black text-slate-800 mb-1">
                  Chưa có sơ đồ nào
                </h3>
                <p className="text-sm font-medium text-slate-500 mb-6">
                  Bạn có thể tạo một sơ đồ mới hoặc sử dụng Mẫu của VNPT.
                </p>
                <button
                  onClick={() => navigate("/DrawDiagram")}
                  className="bg-[#0066cc] hover:bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Bắt đầu Vẽ sơ đồ
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {renderGroup("Hôm nay", groupedDiagrams.today)}
                {renderGroup("Hôm qua", groupedDiagrams.yesterday)}
                {renderGroup("7 ngày gần đây", groupedDiagrams.thisWeek)}
                {renderGroup("Cũ hơn", groupedDiagrams.older)}
              </div>
            )}
          </section>
        </div>

        {/* Modal Đổi Tên */}
        <Dialog open={!!renameData} onOpenChange={(val) => { if (!val) setRenameData(null) }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Thông tin sơ đồ</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
               <div>
                 <label className="text-sm font-semibold text-slate-700 block mb-1">Tiêu đề</label>
                 <input 
                    type="text" 
                    autoFocus
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
                    placeholder="Nhập tên mới..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === "Enter") executeRename();
                    }}
                 />
               </div>
               <div>
                 <label className="text-sm font-semibold text-slate-700 block mb-1">Mô tả ngắn</label>
                 <textarea 
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0066cc] resize-none"
                    placeholder="Nhập mô tả ngắn cho sơ đồ..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                 />
               </div>
            </div>
            <DialogFooter>
              <button 
                  onClick={() => setRenameData(null)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors disabled:opacity-50"
              >
                  Hủy
              </button>
              <button 
                  onClick={executeRename}
                  disabled={isSaving || !newTitle.trim()}
                  className="ml-2 px-4 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
              >
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Xóa */}
        <AlertDialog open={!!deleteId} onOpenChange={(val) => { if (!val) setDeleteId(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Chuyển vào thùng rác?</AlertDialogTitle>
               <AlertDialogDescription>
                   Sơ đồ sẽ được chuyển vào thùng rác. Bạn có thể khôi phục lại hoặc xóa vĩnh viễn từ đó.
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>Hủy</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={executeDelete} 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isSaving}
                >
                    {isSaving ? "Đang xử lý..." : "Chuyển vào thùng rác"}
                </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

    </DashboardLayout>
  );
};

export default DashBoard;
