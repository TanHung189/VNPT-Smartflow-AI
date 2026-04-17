import React, { useEffect, useState } from "react";
import { AdminApi, UserAdminDTO, UserAdminUpdateDTO } from "../../../services/adminApi";
import { Switch } from "../../../components/ui/switch";
import { Users, Loader2, Shield, User, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../../components/ui/badge";

export const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<UserAdminDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounce search state
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 when search changes
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, roleFilter, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await AdminApi.getUsers({
        search: debouncedSearch || undefined,
        id_vai_tro: roleFilter,
        skip: (page - 1) * limit,
        limit
      });
      setUsers(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
      // toast is already handled by interceptor, so no generic toast here is fine.
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, payload: UserAdminUpdateDTO) => {
    try {
      await AdminApi.updateUser(id, payload);
      toast.success("Cập nhật thành công!");
      fetchUsers();
    } catch (error) {
      // Interceptor handles error messages
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Quản lý Người Dùng
          </h2>
          <p className="text-slate-500 text-sm mt-1">Quản lý phân quyền và trạng thái hoạt động ({total} người dùng)</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm người dùng, email..." 
            className="border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select 
            className="border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white cursor-pointer"
            value={roleFilter || ""}
            onChange={(e) => { 
               setRoleFilter(e.target.value ? Number(e.target.value) : undefined); 
               setPage(1); 
            }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="1">Quản trị viên (Admin)</option>
            <option value="2">Nhân viên</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Người dùng</th>
              <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phòng ban</th>
              <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Vai trò</th>
              <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  Không tìm thấy người dùng nào phù hợp.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id_nguoi_dung} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-medium text-slate-800">{user.ten_nguoi_dung}</td>
                  <td className="py-4 px-4 text-slate-600 text-sm">{user.email}</td>
                  <td className="py-4 px-4 text-slate-600 text-sm">{user.ten_phong_ban || "-"}</td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleUpdate(user.id_nguoi_dung, { id_vai_tro: user.id_vai_tro === 1 ? 2 : 1 })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        user.id_vai_tro === 1
                          ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {user.id_vai_tro === 1 ? <Shield size={14} /> : <User size={14} />}
                      {user.id_vai_tro === 1 ? "Admin" : "Nhân viên"}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Switch
                      checked={user.trang_thai_hoat_dong}
                      onCheckedChange={(checked: boolean) => handleUpdate(user.id_nguoi_dung, { trang_thai_hoat_dong: checked })}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
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

    </div>
  );
};
