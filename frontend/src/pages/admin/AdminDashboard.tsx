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
import { motion, AnimatePresence } from "framer-motion";

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
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
        {
          title: "Kết nối Server",
          value: "Đang kiểm tra...",
          trend: "up",
          iconType: "success",
        }
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <section>
              <StatsCards stats={stats} />
            </section>
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 h-full">
                <PerformanceChart data={chartData} />
              </div>
              <div className="xl:col-span-1 h-full">
                <AiUsageChart data={aiUsageStats} />
              </div>
            </section>
          </motion.div>
        );
      case "users":
        return (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <UserManagementTable />
          </motion.div>
        );
      case "diagrams":
        return (
          <motion.div
            key="diagrams"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <DiagramManagementTable />
          </motion.div>
        );
      case "ai-config":
        return (
          <motion.div
            key="ai-config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <AiModelManagement />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden relative selection:bg-[#005A9C] selection:text-white">
        <Header adminName="Admin" />

        <main className="flex-1 overflow-y-auto w-full p-8 pb-12 transition-all duration-300">
          {loading ? (
            <div className="flex w-full items-center justify-center p-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {renderTabContent()}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
