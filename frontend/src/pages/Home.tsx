import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Activity, Zap, Layers, Cpu } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-[#fcfdfe] relative scroll-smooth">
      <Navbar />
      {/* Background Blobs - Đốm màu đa sắc mờ ảo */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-violet-100/40 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-emerald-50/40 rounded-full blur-[100px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-black mb-8 animate-bounce">
            <Sparkles className="w-3 h-3" />
            <span>CÔNG NGHỆ AI TIÊN PHONG TẠI VNPT</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 italic">
            Vẽ quy trình <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
              bằng tốc độ ý nghĩ
            </span>
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium">
            Biến những văn bản nghiệp vụ khô khan thành sơ đồ luồng sinh động.
            Giải pháp chuyên biệt cho hệ sinh thái chuyển đổi số VNPT.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/DrawDiagram"
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-6 rounded-2xl font-black text-lg hover:shadow-[0_20px_50px_rgba(31,_73,_225,_0.35)] transition-all hover:-translate-y-2 active:scale-95"
            >
              Bắt đầu sáng tạo <ArrowRight className="w-6 h-6" />
            </Link>
            <button className="w-full sm:w-auto px-12 py-6 rounded-2xl font-black text-slate-600 bg-white border-2 border-slate-100 hover:bg-slate-50 transition-all shadow-sm">
              Trình diễn thực tế
            </button>
          </div>

          {/* Preview Editor với Glassmorphism */}
          <div className="mt-24 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-[40px] blur-2xl opacity-10" />
            <div className="relative bg-white/70 backdrop-blur-xl p-3 rounded-[32px] shadow-2xl border border-white">
              <div className="rounded-[22px] overflow-hidden border border-slate-100 bg-slate-900 aspect-video flex items-center justify-center group">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                  <Activity className="w-24 h-24 text-blue-500 animate-pulse relative z-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section - Đa màu sắc cho con số */}
      <section className="py-24 max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        <StatCard val="98%" label="Độ chính xác AI" color="text-emerald-500" />
        <StatCard val="3s" label="Thời gian xử lý" color="text-blue-500" />
        <StatCard val="500+" label="Quy trình mẫu" color="text-amber-500" />
        <StatCard val="100%" label="Bảo mật dữ liệu" color="text-rose-500" />
      </section>

      {/* Feature Section - Phối màu đa dạng */}
      <section className="py-24 bg-slate-50/50 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              Sức mạnh của SmartFlow AI
            </h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard
              icon={<Zap className="w-7 h-7 text-amber-500" />}
              title="Xử lý thần tốc"
              desc="Tận dụng sức mạnh từ Gemini 1.5 Pro để hiểu sâu văn bản nghiệp vụ VNPT."
              bgColor="bg-amber-50"
            />
            <FeatureCard
              icon={<Layers className="w-7 h-7 text-indigo-500" />}
              title="Đa dạng mẫu mã"
              desc="Hàng trăm layout sơ đồ từ BPMN đến Flowchart tùy chỉnh theo sở thích."
              bgColor="bg-indigo-50"
            />
            <FeatureCard
              icon={<Cpu className="w-7 h-7 text-emerald-500" />}
              title="Agent Tự học"
              desc="Hệ thống tự động ghi nhớ thói quen vẽ sơ đồ để gợi ý chính xác hơn."
              bgColor="bg-emerald-50"
            />
          </div>
        </div>
      </section>

      {/* How it works - Section làm dài trang web */}
      <section className="py-32 max-w-5xl mx-auto px-6">
        <div className="flex flex-col gap-24">
          <StepRow
            num="01"
            title="Nhập dữ liệu đầu vào"
            desc="Tải file DOCX quy trình hoặc dán đoạn văn bản mô tả nghiệp vụ của bạn vào trình soạn thảo."
            color="bg-blue-600"
          />
          <StepRow
            num="02"
            title="AI Phân tích & Phác thảo"
            desc="Mô hình ngôn ngữ lớn sẽ bóc tách các thực thể, điều kiện và hành động để xây dựng logic đồ thị."
            color="bg-violet-600"
            reverse
          />
          <StepRow
            num="03"
            title="Tinh chỉnh & Xuất bản"
            desc="Kéo thả để hoàn thiện theo ý muốn và xuất ra các định dạng chất lượng cao như SVG, PNG hoặc SQL."
            color="bg-emerald-600"
          />
        </div>
      </section>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Veritatis odit
        non et reiciendis neque totam molestiae fugit. Autem, suscipit
        consectetur quia recusandae iusto adipisci ea ratione nesciunt voluptate
        facere expedita. Nam sint dolore voluptatum itaque voluptatem veniam
        expedita natus eos amet distinctio accusamus excepturi nostrum culpa,
        maxime deleniti adipisci omnis unde commodi temporibus consectetur iste
        optio? Cum saepe repellat obcaecati? Quia, maxime explicabo sint iusto
        aliquam ipsam quidem eligendi architecto rem minima obcaecati
        praesentium ex. Quae excepturi laboriosam modi temporibus itaque!
        Dignissimos rerum debitis et itaque, repellendus minus saepe incidunt!
        Reprehenderit incidunt omnis optio voluptate. Esse adipisci corporis,
        recusandae non aspernatur nemo magni asperiores, qui maiores temporibus
        fugiat aperiam at odio voluptate cupiditate quam tempore ab voluptatem
        blanditiis, ex expedita? Possimus non pariatur, reprehenderit libero
        vitae fuga. Vitae soluta nobis dolorum commodi sequi aspernatur tempora
        aut totam mollitia, fuga magni, dolores sapiente possimus ea placeat
        quis architecto, aperiam neque rerum. Inventore quam repellat possimus!
        Voluptatibus possimus magni pariatur, ducimus ipsum molestias alias? Ab
        consectetur soluta, praesentium sequi illo quos sapiente non quibusdam
        dolor atque cumque officiis fugit, voluptatem tempora doloremque. Nam
        eos laboriosam sunt ipsa autem fuga saepe recusandae, iure excepturi
        animi quidem dolores dolorum libero possimus in blanditiis quod fugiat
        reiciendis. Officiis soluta repudiandae dolore rerum, laudantium esse
        possimus. Quasi aliquam iure, dignissimos aperiam rerum blanditiis, rem
        hic laborum perspiciatis odit cupiditate praesentium vitae quod minima
        eum inventore ea illum nemo eius distinctio error harum. Consequatur
        autem voluptates iusto!
      </p>
      <Footer />
    </div>
  );
};

// Component con để code sạch hơn
const StatCard = ({ val, label, color }: any) => (
  <div className="text-center group">
    <h3
      className={`text-5xl font-black mb-2 transition-transform group-hover:scale-110 ${color}`}
    >
      {val}
    </h3>
    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
      {label}
    </p>
  </div>
);

const StepRow = ({ num, title, desc, color, reverse }: any) => (
  <div
    className={`flex flex-col md:flex-row items-center gap-16 group/step ${reverse ? "md:flex-row-reverse" : ""}`}
  >
    <div
      className={`w-24 h-24 rounded-3xl ${color} flex items-center justify-center text-white text-4xl font-black shadow-2xl shrink-0 transition-transform duration-500 group-hover/step:rotate-12 group-hover/step:scale-110`}
    >
      {num}
    </div>
    <div
      className={`${reverse ? "text-right" : "text-left"} transition-all duration-500 group-hover/step:translate-x-2`}
    >
      <h3 className="text-3xl font-black text-slate-900 mb-4">{title}</h3>
      <p className="text-lg text-slate-500 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, desc, bgColor }: any) => (
  <div
    className={`p-10 ${bgColor} rounded-[40px] border border-transparent hover:border-white hover:shadow-2xl transition-all duration-500 group`}
  >
    <div className="w-16 h-16 rounded-[24px] bg-white shadow-sm flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
      {icon}
    </div>
    <h3 className="text-2xl font-black text-slate-800 mb-4">{title}</h3>
    <p className="text-slate-600 font-medium leading-relaxed">{desc}</p>
  </div>
);

export default Home;
