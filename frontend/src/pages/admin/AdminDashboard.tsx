import React from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { StatsCards, StatData } from "./components/StatsCards";
import { PerformanceChart, ChartDataPoint } from "./components/PerformanceChart";
import { RecentActivitiesTable, Activity } from "./components/RecentActivitiesTable";

export const AdminDashboard: React.FC = () => {
  // Mock Data Definition
  
  // Stats Data
  const mockStats: StatData[] = [
    {
      title: 'Tổng User',
      value: '2,450',
      change: '+12.5%',
      trend: 'up',
      iconType: 'users',
    },
    {
      title: 'Tổng Quy trình',
      value: '14,200',
      change: '+5.2%',
      trend: 'up',
      iconType: 'workflows',
    },
    {
      title: 'Tỷ lệ Tiết kiệm Thời gian',
      value: '45%',
      change: '-2.1%',
      trend: 'down',
      iconType: 'time',
    },
  ];

  // Chart Data (Workflow creation by day)
  const mockChartData: ChartDataPoint[] = [
    { date: 'T2', total: 40 },
    { date: 'T3', total: 70 },
    { date: 'T4', total: 55 },
    { date: 'T5', total: 110 },
    { date: 'T6', total: 150 },
    { date: 'T7', total: 60 },
    { date: 'CN', total: 45 },
  ];

  // Recent Activities
  const mockActivities: Activity[] = [
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

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
      {/* Sidebar - Fixed Left */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 overflow-hidden relative selection:bg-[#005A9C] selection:text-white">
        {/* Header - Fixed Top */}
        <Header adminName="Hưng" />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto w-full p-8 pb-12 transition-all duration-300">
          
          {/* Stats Cards Overview */}
          <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StatsCards stats={mockStats} />
          </section>

          {/* Charts and Tables */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Diagram History Chart - spans 2 columns on large screens */}
            <div className="xl:col-span-2 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <PerformanceChart data={mockChartData} />
            </div>

            {/* Recent Activities Table - spans 1 column on large screens */}
            <div className="xl:col-span-1 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <RecentActivitiesTable activities={mockActivities} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
