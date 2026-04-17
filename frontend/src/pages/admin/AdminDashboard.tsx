import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { StatsCards, StatData } from "./components/StatsCards";
import { PerformanceChart, ChartDataPoint } from "./components/PerformanceChart";
import { UserManagementTable } from "./components/UserManagementTable";
import { DiagramManagementTable } from "./components/DiagramManagementTable";
import { AiModelManagement } from "./components/AiModelManagement";
import { AiUsageChart, AiUsageStatDTO } from "./components/AiUsageChart";
import { AdminApi } from "../../services/adminApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [aiUsageStats, setAiUsageStats] = useState<AiUsageStatDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await AdminApi.getStats();
      
      setStats([
        {
          title: "Tổng User",
          value: data.total_users.toLocaleString(),
          trend: "neutral",
          iconType: "users",
        },
        {
          title: "Tổng Quy trình",
          value: data.total_diagrams.toLocaleString(),
          trend: "neutral",
          iconType: "workflows",
        },
        {
          title: "Tổng Token AI (Output)",
          value: data.total_tokens.toLocaleString(),
          trend: "neutral",
          iconType: "time",
        },
      ]);
      setChartData(data.chart_data || []);
      setAiUsageStats(data.ai_usage_stats || []);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden relative selection:bg-[#005A9C] selection:text-white">
        <Header adminName="Admin" />

        <main className="flex-1 overflow-y-auto w-full p-8 pb-12 transition-all duration-300">
          
          {loading ? (
            <div className="flex w-full items-center justify-center p-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {/* Stats Cards Overview */}
              <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StatsCards stats={stats} />
              </section>

              {/* Charts and Tables */}
              <section className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                {/* Diagram History Chart - spans 2 columns */}
                <div className="xl:col-span-2 animate-in fade-in slide-in-from-bottom-6 duration-700 h-full">
                  <PerformanceChart data={chartData} />
                </div>

                {/* AI Usage Pie Chart - spans 1 column */}
                <div className="xl:col-span-1 animate-in fade-in slide-in-from-bottom-8 duration-700 h-full">
                  <AiUsageChart data={aiUsageStats} />
                </div>
              </section>

              {/* User Management */}
              <section className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <UserManagementTable />
              </section>

              {/* Sơ đồ Quản Lý (Template Switcher) */}
              <section className="mt-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <DiagramManagementTable />
              </section>

              {/* AI Models Management */}
              <section className="mt-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <AiModelManagement />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
