import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { diagramApi, DiagramListItem } from "../services/diagramApi";
import { formatTimeAgo } from "../utils/dateUtils";
import { toast } from "sonner";
import {
  Network,
  Users,
  LayoutList,
  GitBranch,
  BrainCircuit,
  FileBox,
  MoreVertical,
  RotateCcw,
  Trash2,
  Trash
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
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
import { Button } from "../components/ui/button";

const getIconForType = (the_loai?: string) => {
  const t = (the_loai || "").toLowerCase();
  if (t === "org-chart" || t === "org") return <Users className="w-5 h-5" />;
  if (t === "uml" || t === "uml-class") return <LayoutList className="w-5 h-5" />;
  if (t === "mindmap") return <BrainCircuit className="w-5 h-5" />;
  if (t === "process" || t === "ioffice" || t === "workflow") return <GitBranch className="w-5 h-5" />;
  if (t === "network" || t === "infrastructure") return <Network className="w-5 h-5" />;
  return <FileBox className="w-5 h-5" />;
};

const TrashPage: React.FC = () => {
  const navigate = useNavigate();
  const [diagrams, setDiagrams] = useState<DiagramListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States cho modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchDiagrams = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await diagramApi.getTrash(token);
      const dataArray = Array.isArray(data) ? data : ((data as any).data || (data as any).items || []);
      setDiagrams(dataArray);
    } catch (err) {
      toast.error("Không thể tải danh sách thùng rác");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagrams();
  }, []);

  const executeHardDelete = async () => {
    if (!deleteId) return;
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      await diagramApi.hardDelete(deleteId, token);
      toast.success("Đã xóa vĩnh viễn!");
      await fetchDiagrams();
    } catch (error) {
      // lỗi đã báo bởi axios
    } finally {
      setIsSaving(false);
      setDeleteId(null);
    }
  };

  const executeRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      await diagramApi.restore(id, token);
      toast.success("Đã khôi phục sơ đồ!");
      await fetchDiagrams();
    } catch (error) {
      // lỗi đã báo ở axios
    } finally {
      setIsSaving(false);
    }
  };

  const executeEmptyTrash = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      await diagramApi.emptyTrash(token);
      toast.success("Đã dọn sạch thùng rác!");
      await fetchDiagrams();
    } catch (error) {
        // Error toast shown
    } finally {
      setIsSaving(false);
      setEmptyTrashConfirm(false);
    }
  };

  return (
    <DashboardLayout activeTab="Trash">
      <div className="w-full h-full py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Thùng rác</h1>
            {diagrams.length > 0 && (
                <Button variant={"destructive"} onClick={() => setEmptyTrashConfirm(true)} disabled={isLoading || isSaving}>
                    Dọn sạch thùng rác
                </Button>
            )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]"></div>
          </div>
        ) : diagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 max-w-xl mx-auto text-center px-4">
             <Trash2 className="w-16 h-16 text-slate-300 mb-4" />
             <h3 className="text-[18px] font-bold text-slate-800 mb-2">Thùng rác trống</h3>
             <p className="text-[14px] text-slate-500 mb-6">Bạn chưa xóa sơ đồ nào hoặc đã dọn sạch thùng rác.</p>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            <div className="mb-10 w-full max-w-5xl mx-auto px-4 sm:px-8">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 pb-2 mb-2 border-b border-slate-200 text-slate-500 text-[13px] font-medium px-2">
                    <div className="col-span-5 sm:col-span-5 hidden sm:block">Tên Sơ Đồ</div>
                    <div className="col-span-12 sm:hidden block">Tên Sơ Đồ</div>
                    <div className="col-span-2 hidden sm:block">Thể loại</div>
                    <div className="col-span-2 hidden sm:block">Thời gian xóa</div>
                    <div className="col-span-2 hidden sm:block">Sở hữu</div>
                    <div className="col-span-1 hidden sm:block"></div>
                </div>

                <div className="flex flex-col">
                {diagrams.map((d) => (
                    <div
                    key={d.id_so_do}
                    className="group grid grid-cols-12 gap-4 items-center p-2 rounded-lg hover:bg-slate-100 transition-colors border border-transparent"
                    >
                    {/* Tên Sơ Đồ */}
                    <div className="col-span-10 sm:col-span-5 flex items-center gap-4 opacity-70">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-md shadow-sm flex items-center justify-center shrink-0 text-[#0066cc]">
                        {getIconForType(d.the_loai)}
                        </div>
                        <div className="overflow-hidden min-w-0">
                        <p className="text-[15px] font-medium text-slate-900 line-through truncate transition-colors">
                            {d.tieu_de}
                        </p>
                        <p className="text-[12px] text-slate-500 sm:hidden mt-0.5 truncate flex items-center gap-2">
                            {formatTimeAgo(d.ngay_cap_nhat)}
                        </p>
                        </div>
                    </div>
                    
                    {/* Thể loại */}
                    <div className="col-span-2 hidden sm:flex flex-col justify-center min-w-0 opacity-70">
                        <span className="text-[13px] text-slate-700 capitalize truncate mb-1">
                            {d.the_loai || "Sơ đồ"}
                        </span>
                    </div>

                    {/* Ngày cập nhật */}
                    <div className="col-span-2 hidden sm:flex flex-col justify-center opacity-70">
                        <span className="text-[13px] text-slate-700">{formatTimeAgo(d.ngay_cap_nhat)}</span>
                        <span className="text-[11px] text-slate-400">{new Date(d.ngay_cap_nhat).toLocaleDateString("vi-VN")}</span>
                    </div>

                    {/* Owner */}
                    <div className="col-span-2 hidden sm:flex items-center text-[13px] text-slate-600 opacity-70">
                        <div className="flex items-center gap-2">
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
                                    onClick={(e) => executeRestore(d.id_so_do, e as any)}
                                    className="text-[13px] text-slate-700 py-2 px-3 hover:bg-slate-50 cursor-pointer flex items-center focus:bg-slate-50"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 mr-2 text-slate-400" /> Khôi phục
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-100 my-1" />
                                <DropdownMenuItem 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteId(d.id_so_do);
                                    }}
                                    className="text-[13px] text-red-600 py-2 px-3 hover:bg-red-50 cursor-pointer flex items-center font-medium focus:bg-red-50 focus:text-red-700"
                                >
                                    <Trash className="w-3.5 h-3.5 mr-2" /> Xóa vĩnh viễn
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                    </div>
                    </div>
                ))}
                </div>
            </div>
          </div>
        )}

        {/* CÁC MODAL HỖ TRỢ */}

        {/* Modal Xóa 1 cái */}
        <AlertDialog open={!!deleteId} onOpenChange={(val) => { if (!val) setDeleteId(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Xóa vĩnh viễn?</AlertDialogTitle>
               <AlertDialogDescription>
                   Thao tác này sẽ xóa vĩnh viễn sơ đồ này và không thể hoàn tác. Xin lưu ý.
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>Hủy</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={executeHardDelete} 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isSaving}
                >
                    {isSaving ? "Đang xóa..." : "Xóa vĩnh viễn"}
                </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal Dọn rác */}
        <AlertDialog open={emptyTrashConfirm} onOpenChange={setEmptyTrashConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Dọn sạch thùng rác?</AlertDialogTitle>
               <AlertDialogDescription>
                   Thao tác này sẽ xóa vĩnh viễn TẤT CẢ sơ đồ trong thùng rác và không thể hoàn tác.
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>Hủy</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={executeEmptyTrash} 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isSaving}
                >
                    {isSaving ? "Đang xóa..." : "Dọn sạch"}
                </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </DashboardLayout>
  );
};

export default TrashPage;
