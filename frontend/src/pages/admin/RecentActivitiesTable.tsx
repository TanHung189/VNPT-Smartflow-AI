import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const activities = [
  {
    id: 'PR-1023',
    name: 'Quy trình Xin nghỉ phép',
    creator: 'Nguyễn Văn A',
    time: '10 phút trước',
    status: 'success',
  },
  {
    id: 'PR-1024',
    name: 'Quy trình Cấp phát thiết bị',
    creator: 'Trần Thị B',
    time: '35 phút trước',
    status: 'success',
  },
  {
    id: 'PR-1025',
    name: 'Quy trình Đánh giá KPI',
    creator: 'Lê Hoàng C',
    time: '1 giờ trước',
    status: 'error',
  },
  {
    id: 'PR-1026',
    name: 'Quy trình Đăng ký làm thêm',
    creator: 'Phạm Văn D',
    time: '2 giờ trước',
    status: 'success',
  },
  {
    id: 'PR-1027',
    name: 'Quy trình Chuyển công tác',
    creator: 'Hoàng Thị E',
    time: '3.5 giờ trước',
    status: 'pending',
  },
];

export const RecentActivitiesTable: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Quy trình Gần đây</h2>
        <button className="text-sm text-[#005A9C] font-medium hover:underline">Xem tất cả</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4">Mã QT</th>
              <th scope="col" className="px-6 py-4">Tên Quy Trình</th>
              <th scope="col" className="px-6 py-4">Người tạo</th>
              <th scope="col" className="px-6 py-4">Thời gian</th>
              <th scope="col" className="px-6 py-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((item, idx) => (
              <tr key={item.id} className={`bg-white ${idx !== activities.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {item.id}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                      {item.creator.split(' ').pop()?.[0]}
                    </div>
                    {item.creator}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.time}
                </td>
                <td className="px-6 py-4">
                  {item.status === 'success' && (
                    <span className="flex items-center text-green-600 bg-green-50 px-2.5 py-1 rounded-full w-fit">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      <span className="font-medium text-xs">Thành công</span>
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="flex items-center text-red-600 bg-red-50 px-2.5 py-1 rounded-full w-fit">
                      <XCircle className="w-4 h-4 mr-1.5" />
                      <span className="font-medium text-xs">Lỗi</span>
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <span className="flex items-center text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full w-fit">
                      <Clock className="w-4 h-4 mr-1.5" />
                      <span className="font-medium text-xs">Đang xử lý</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
