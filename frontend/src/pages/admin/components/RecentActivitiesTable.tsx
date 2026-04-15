import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export interface Activity {
  id: string;
  name: string;
  creator: string;
  time: string;
  status: 'success' | 'error' | 'pending';
}

interface RecentActivitiesTableProps {
  activities: Activity[];
}

export const RecentActivitiesTable: React.FC<RecentActivitiesTableProps> = ({ activities }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-gray-900">Quy trình Gần đây</h2>
        <button className="text-sm text-[#005A9C] font-semibold hover:text-[#004a82] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
          Xem tất cả
        </button>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Mã QT</th>
              <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Tên Quy Trình</th>
              <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Người tạo</th>
              <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Thời gian</th>
              <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activities.length > 0 ? (
              activities.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-blue-50/40 transition-colors group">
                  <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#005A9C]/10 text-[#005A9C] flex items-center justify-center font-bold text-xs uppercase shadow-sm group-hover:bg-[#005A9C] group-hover:text-white transition-colors">
                        {item.creator.split(' ').pop()?.[0]}
                      </div>
                      <span className="font-medium text-gray-700">{item.creator}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {item.time}
                  </td>
                  <td className="px-6 py-4">
                    {item.status === 'success' && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 w-fit">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-semibold text-xs">Hoàn thành</span>
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 w-fit">
                        <XCircle className="w-4 h-4" />
                        <span className="font-semibold text-xs">Thất bại</span>
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 w-fit">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold text-xs">Đang xử lý</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Không có quy trình nào gần đây
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
