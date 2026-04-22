import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { diagramApi, DiagramListItem } from "../services/diagramApi";
import { groupDiagramsByDate, formatTimeAgo, TimeGroup } from "../utils/dateUtils";
import { toast } from "sonner";
import {
  Network,
  Users,
  LayoutList,
  GitBranch,
  BrainCircuit,
  FileBox,
  MoreVertical,
  Pencil,
  Trash,
  FolderOpen
} from "lucide-react";
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

const getIconForType = (the_loai?: string) => {
  const t = (the_loai || "").toLowerCase();
  if (t === "org-chart" || t === "org") return <Users className="w-5 h-5" />;
  if (t === "uml" || t === "uml-class") return <LayoutList className="w-5 h-5" />;
  if (t === "mindmap") return <BrainCircuit className="w-5 h-5" />;
  if (t === "process" || t === "ioffice" || t === "workflow") return <GitBranch className="w-5 h-5" />;
  if (t === "network" || t === "infrastructure") return <Network className="w-5 h-5" />;
  return <FileBox className="w-5 h-5" />;
};

const Recent: React.FC = () => {
  const navigate = useNavigate();
  const [diagrams, setDiagrams] = useState<DiagramListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States cho modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameData, setRenameData] = useState<{ id: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchDiagrams = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await diagramApi.getAll(token);
      const dataArray = Array.isArray(data) ? data : ((data as any).data || (data as any).items || []);
      setDiagrams(dataArray);
    } catch (err) {
      toast.error("Không thể tải danh sách sơ đồ");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagrams();
  }, []);

  const groupedDiagrams = useMemo(() => {
    return groupDiagramsByDate(diagrams);
  }, [diagrams]);

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      await diagramApi.delete(deleteId, token);
      toast.success("Đã xóa sơ đồ!");
      await fetchDiagrams(); // Refresh list
    } catch (error) {
      // lỗi đã được xử lý ở axios interceptor
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
      // Dùng update để đổi tiêu đề. Cần gửi cả data rỗng vì partial update backend có hỗ trợ hay không?
      // Nếu backend yêu cầu đầy đủ payload, hãy fetch trước rồi update.
      // Do yêu cầu "biến đổi thành thao tác nâng cao trải nghiệm", hãy giả định mình gửi title update hoặc dùng update hiện tại.
      const currentDiagram = await diagramApi.getById(renameData.id, token);
      const originalInfo = diagrams.find(d => d.id_so_do === renameData.id);
      
      await diagramApi.update(renameData.id, {
          tieu_de: newTitle.trim(),
          du_lieu_so_do: currentDiagram.du_lieu_so_do as any,
          the_loai: originalInfo?.the_loai,
          la_noi_bo: currentDiagram.la_noi_bo
      }, token);
      toast.success("Đổi tên thành công!");
      await fetchDiagrams();
    } catch (error) {
       toast.error("Có lỗi xảy ra khi đổi tên.");
    } finally {
      setIsSaving(false);
      setRenameData(null);
      setNewTitle("");
    }
  };

  const renderGroup = (title: string, list: DiagramListItem[]) => {
    if (list.length === 0) return null;
    return (
      <div key={title} className="mb-10 w-full max-w-5xl mx-auto px-4 sm:px-8">
        <h3 className="text-[14px] font-bold text-slate-800 mb-3">{title}</h3>
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 pb-2 mb-2 border-b border-slate-200 text-slate-500 text-[13px] font-medium px-2">
            <div className="col-span-5 sm:col-span-5 hidden sm:block">Tên Sơ Đồ</div>
            <div className="col-span-12 sm:hidden block">Tên Sơ Đồ</div>
            <div className="col-span-2 hidden sm:block">Thể loại</div>
            <div className="col-span-2 hidden sm:block">Cập nhật lúc</div>
            <div className="col-span-2 hidden sm:block">Sở hữu</div>
            <div className="col-span-1 hidden sm:block"></div>
        </div>

        <div className="flex flex-col">
          {list.map((d) => (
            <div
              key={d.id_so_do}
              onClick={() => navigate(`/DrawDiagram?id=${d.id_so_do}`)}
              className="group cursor-pointer grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-slate-100 transition-colors border border-transparent"
            >
              {/* Tên Sơ Đồ */}
              <div className="col-span-10 sm:col-span-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-md shadow-sm flex items-center justify-center shrink-0 text-[#0066cc]">
                   {getIconForType(d.the_loai)}
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-[15px] font-medium text-slate-900 group-hover:text-[#0066cc] truncate transition-colors">
                    {d.tieu_de}
                  </p>
                  <p className="text-[12px] text-slate-500 sm:hidden mt-0.5 truncate flex items-center gap-2">
                      {formatTimeAgo(d.ngay_cap_nhat)}
                  </p>
                </div>
              </div>
              
              {/* Thể loại */}
              <div className="col-span-2 hidden sm:flex flex-col justify-center min-w-0">
                  <span className="text-[13px] text-slate-700 capitalize truncate mb-1">
                      {d.the_loai || "Sơ đồ"}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                      {d.la_noi_bo && (
                          <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-1.5 py-[2px] rounded uppercase">Local AI</span>
                      )}
                      {d.la_mau_chuan && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-[2px] rounded uppercase">Mẫu chuẩn</span>
                      )}
                  </div>
              </div>

              {/* Ngày cập nhật */}
              <div className="col-span-2 hidden sm:flex flex-col justify-center">
                 <span className="text-[13px] text-slate-700">{formatTimeAgo(d.ngay_cap_nhat)}</span>
                 <span className="text-[11px] text-slate-400">{new Date(d.ngay_cap_nhat).toLocaleDateString("vi-VN")}</span>
              </div>

              {/* Owner */}
              <div className="col-span-2 hidden sm:flex items-center text-[13px] text-slate-600">
                 <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-[10px] font-bold">
                         T
                     </div>
                     <span>Tôi</span>
                 </div>
              </div>
                 
              {/* Action Menu */}
              <div className="col-span-2 sm:col-span-1 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-800 hover:bg-slate-200 rounded transition-all">
                            <MoreVertical className="w-[18px] h-[18px]" />
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
                                setRenameData({ id: d.id_so_do, title: d.tieu_de });
                                setNewTitle(d.tieu_de);
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
                            <Trash className="w-3.5 h-3.5 mr-2" /> Xóa
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const timeEntries: { title: TimeGroup; list: DiagramListItem[] }[] = [
    { title: "Hôm nay", list: groupedDiagrams["Hôm nay"] },
    { title: "Hôm qua", list: groupedDiagrams["Hôm qua"] },
    { title: "7 ngày gần đây", list: groupedDiagrams["7 ngày gần đây"] },
    { title: "30 ngày gần đây", list: groupedDiagrams["30 ngày gần đây"] },
    { title: "Cũ hơn", list: groupedDiagrams["Cũ hơn"] },
  ];

  return (
    <DashboardLayout activeTab="Recent">
      <div className="w-full h-full py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recent</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]"></div>
          </div>
        ) : diagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 max-w-xl mx-auto text-center px-4">
             <FolderOpen className="w-16 h-16 text-slate-300 mb-4" />
             <h3 className="text-[18px] font-bold text-slate-800 mb-2">Chưa có sơ đồ nào gần đây</h3>
             <p className="text-[14px] text-slate-500 mb-6">Các sơ đồ bạn tạo hoặc xem gần đây sẽ xuất hiện ở đây.</p>
             <button
                  onClick={() => navigate("/DrawDiagram")}
                  className="bg-[#0066cc] hover:bg-blue-700 text-white text-[14px] font-bold px-6 py-2.5 rounded-lg transition-all shadow-sm"
                >
                  Tạo sơ đồ mới
                </button>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {timeEntries.map(({ title, list }) => renderGroup(title, list))}
          </div>
        )}

        {/* CÁC MODAL HỖ TRỢ */}

        {/* Modal Đổi Tên */}
        <Dialog open={!!renameData} onOpenChange={(val) => { if (!val) setRenameData(null) }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Đổi tên sơ đồ</DialogTitle>
            </DialogHeader>
            <div className="py-4">
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
                  disabled={isSaving || !newTitle.trim() || newTitle === renameData?.title}
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

      </div>
    </DashboardLayout>
  );
};

export default Recent;
