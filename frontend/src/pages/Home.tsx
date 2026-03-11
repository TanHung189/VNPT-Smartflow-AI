import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Activity, Zap, ShieldCheck } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#fcfdfe] overflow-x-hidden">
      {/* Background Decor - Tạo các đốm màu mờ ảo như Dribbble */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_50%_10%,_#e0e7ff_0%,_transparent_50%)] opacity-50 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge Thông báo */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold mb-8 animate-fade-in">
            <Zap className="w-3 h-3 fill-current" />
            <span>abczxc</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
            Tự động hóa quy trình <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0054a6] to-[#00a3ff]">
              Thông minh hơn với AI
            </span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Chuyển đổi các văn bản nghiệp vụ phức tạp của VNPT thành sơ đồ tương
            tác chỉ trong vài giây. Tối ưu hóa hiệu suất làm việc với công nghệ
            Agentic Workflow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/editor"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0054a6] text-white px-10 py-5 rounded-2xl font-bold hover:shadow-2xl hover:shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95"
            >
              Bắt đầu ngay miễn phí <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="w-full sm:w-auto px-10 py-5 rounded-2xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all">
              Xem bản Demo
            </button>
          </div>

          {/* Ảnh Preview Giao diện Editor - Giống mẫu Dribbble */}
          <div className="mt-20 relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-blue-400/20 blur-[100px] -z-10 rounded-full" />
            <div className="bg-white p-2 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-200">
              <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-video flex items-center justify-center">
                {/* Hưng có thể thay bằng ảnh chụp màn hình Editor của em */}
                <Activity className="w-20 h-20 text-blue-100 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section - 3 cột tính năng */}
      <section className="py-20 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          icon={<Zap className="w-6 h-6 text-blue-600" />}
          title="Tốc độ vượt trội"
          desc="Phân tích và vẽ sơ đồ chỉ trong 3-5 giây nhờ mô hình Gemini 1.5 Pro."
        />
        <FeatureCard
          icon={<ShieldCheck className="w-6 h-6 text-blue-600" />}
          title="Bảo mật VNPT"
          desc="Dữ liệu được xử lý nội bộ, đảm bảo an toàn thông tin theo tiêu chuẩn ngành."
        />
        <FeatureCard
          icon={<Sparkles className="w-6 h-6 text-blue-600" />}
          title="AI Agentic"
          desc="Agent tự động sửa lỗi logic và tối ưu hóa luồng công việc cho bạn."
        />
      </section>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) => (
  <div className="p-8 bg-white rounded-3xl border border-slate-100 hover:border-blue-100 hover:shadow-xl transition-all group">
    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default Home;
