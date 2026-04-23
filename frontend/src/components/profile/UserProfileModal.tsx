import React, { useState, useEffect } from "react";
import { userApi, UserProfile, UserProfileUpdate } from "../../services/userApi";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { Mail, Building2, Calendar, Clock, Activity, CheckCircle2, XCircle } from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editForm, setEditForm] = useState<UserProfileUpdate>({
    ten_nguoi_dung: "",
    ten_phong_ban: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    } else {
      setIsEditing(false);
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await userApi.getProfile();
      setProfile(data);
      setEditForm({
        ten_nguoi_dung: data.ten_nguoi_dung || "",
        ten_phong_ban: data.ten_phong_ban || "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const updated = await userApi.updateProfile(editForm);
      setProfile(updated);
      setIsEditing(false);
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error) {
      toast.error("Không thể cập nhật hồ sơ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between border-b-none bg-white">
          <DialogTitle className="text-xl font-bold text-slate-800">Thông tin tài khoản</DialogTitle>
        </DialogHeader>

        {isLoading && !profile ? (
          <div className="flex justify-center p-12">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]"></div>
          </div>
        ) : profile ? (
          <div className="flex flex-col">
            {/* Banner & Avatar */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 mb-12">
               <div className="absolute -bottom-10 left-6 sm:left-10 flex items-end">
                  <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
                     <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-black uppercase">
                        {profile.ten_nguoi_dung.charAt(0)}
                     </div>
                  </div>
                  <div className="ml-4 mb-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md shadow-sm border border-slate-200">
                     <h2 className="text-lg font-bold text-slate-800">{profile.ten_nguoi_dung}</h2>
                  </div>
               </div>
            </div>

            <div className="p-6 sm:px-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Cột trái: Form Edit */}
              <div className="flex flex-col gap-5">
                 <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Hồ sơ cá nhân</h3>
                    
                    <div className="grid gap-2 mb-4">
                      <Label htmlFor="email" className="text-slate-600 font-medium">Địa chỉ Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input id="email" value={profile.email} disabled className="pl-9 bg-slate-100/50" />
                      </div>
                    </div>

                    <div className="grid gap-2 mb-4">
                      <Label htmlFor="name" className="text-slate-600 font-medium">Tên hiển thị</Label>
                      <Input 
                        id="name" 
                        value={isEditing ? editForm.ten_nguoi_dung : profile.ten_nguoi_dung} 
                        disabled={!isEditing}
                        onChange={(e) => setEditForm(prev => ({...prev, ten_nguoi_dung: e.target.value}))}
                        className={isEditing ? "border-[#0066cc] ring-1 ring-[#0066cc]/20" : "bg-white"}
                      />
                    </div>

                    <div className="grid gap-2 mb-4">
                      <Label htmlFor="department" className="text-slate-600 font-medium">Phòng ban</Label>
                      <div className="relative">
                         <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                         <Input 
                            id="department" 
                            value={isEditing ? editForm.ten_phong_ban : (profile.ten_phong_ban || "")} 
                            disabled={!isEditing}
                            className={`pl-9 ${isEditing ? "border-[#0066cc] ring-1 ring-[#0066cc]/20" : "bg-white"}`}
                            placeholder={!isEditing ? "Chưa cập nhật" : "Nhập tên phòng ban"}
                            onChange={(e) => setEditForm(prev => ({...prev, ten_phong_ban: e.target.value}))}
                         />
                      </div>
                    </div>
                 </div>
              </div>

              {/* Cột phải: Thông tin hệ thống (Readonly) */}
              <div className="flex flex-col gap-5">
                 <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Thông tin hệ thống</h3>
                    
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
                        <div className="flex flex-col gap-1">
                           <span className="text-[13px] text-slate-500 font-medium flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> Trạng thái tài khoản</span>
                           <div className="flex items-center gap-2 mt-0.5">
                              {profile.trang_thai_hoat_dong ? (
                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-200"><CheckCircle2 className="w-4 h-4"/> Đang hoạt động</span>
                              ) : (
                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-sm font-semibold border border-red-200"><XCircle className="w-4 h-4"/> Bị khóa</span>
                              )}
                           </div>
                        </div>

                        <div className="flex flex-col gap-1">
                           <span className="text-[13px] text-slate-500 font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Ngày tham gia</span>
                           <span className="text-sm text-slate-800 font-medium">
                             {profile.ngay_tao ? format(new Date(profile.ngay_tao), "dd/MM/yyyy") : "Không rõ"}
                           </span>
                        </div>

                        <div className="flex flex-col gap-1">
                           <span className="text-[13px] text-slate-500 font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Đăng nhập gần nhất</span>
                           <span className="text-sm text-slate-800 font-medium">
                             {profile.lan_dang_nhap_cuoi ? format(new Date(profile.lan_dang_nhap_cuoi), "dd/MM/yyyy HH:mm") : "Lần đầu tiên"}
                           </span>
                        </div>
                    </div>
                 </div>
              </div>

            </div>

            <div className="bg-slate-100 p-4 sm:px-10 flex justify-end gap-3 border-t border-slate-200">
              {isEditing ? (
                <>
                  <Button variant="outline" className="bg-white" onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      ten_nguoi_dung: profile.ten_nguoi_dung,
                      ten_phong_ban: profile.ten_phong_ban || ""
                    });
                  }} disabled={isLoading}>
                    Hủy bớt
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading} className="bg-[#0066cc] text-white hover:bg-blue-700 font-bold">
                    {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="bg-[#0066cc] text-white hover:bg-blue-700 font-bold px-6">
                   Chỉnh sửa hồ sơ
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 p-10">Không có dữ liệu người dùng.</div>
        )}
      </DialogContent>
    </Dialog>
  );
};
