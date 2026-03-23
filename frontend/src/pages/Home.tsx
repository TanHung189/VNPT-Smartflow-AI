import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Zap,
  Users,
  Bot,
  Play,
  BrainCircuit,
  Video,
  Image as ImageIcon,
} from "lucide-react";

// Tạo các hạt 3D (business steps/strokes)
const generateParticles = (count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    // Phân bố vùng không gian
    const radius = 100 + Math.random() * 600;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    // z từ -600 đến 600 để tạo chiều sâu 3D
    const z = (Math.random() - 0.5) * 1200;

    return {
      id: i,
      x,
      y,
      z,
      size: Math.random() * 5 + 2, // 2px đến 7px
      color: Math.random() > 0.5 ? "#2563eb" : "#7c3aed", // Blue or Purple
      rotation: Math.random() * 360,
    };
  });
};

const particles = generateParticles(200);

const Home = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 }); // Dùng cho Lerp mượt mà (GPU smooth curve)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse (-1 to 1) based on center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseRef.current.x = (e.clientX - centerX) / centerX;
      mouseRef.current.y = (e.clientY - centerY) / centerY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;
    const render = () => {
      // Lerp for smooth acceleration/deceleration GPU effect
      currentRef.current.x +=
        (mouseRef.current.x - currentRef.current.x) * 0.04;
      currentRef.current.y +=
        (mouseRef.current.y - currentRef.current.y) * 0.04;

      const container = containerRef.current;
      if (container) {
        const elements = container.children;
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          const zStr = el.getAttribute("data-z");
          const baseXStr = el.getAttribute("data-x");
          const baseYStr = el.getAttribute("data-y");

          if (zStr && baseXStr && baseYStr) {
            const z = parseFloat(zStr);
            const baseX = parseFloat(baseXStr);
            const baseY = parseFloat(baseYStr);

            // Tính toán hiệu ứng Parallax: Z lớn (gần Camera) di chuyển nhanh hơn, Z âm lùi sâu di chuyển chậm hơn
            const depthFactor = z / 1000;
            const moveX =
              baseX + currentRef.current.x * (80 + depthFactor * 250);
            const moveY =
              baseY + currentRef.current.y * (80 + depthFactor * 250);

            // GPU Acceleration thông qua translate3d (tránh Layout Thrashing)
            el.style.transform = `translate3d(${moveX}px, ${moveY}px, ${z}px) rotate(${el.getAttribute("data-rot")}deg)`;
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-slate-50 relative font-sans scroll-smooth">
      <Navbar />

      {/* Section 1: Hero - Mở màn bùng nổ */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-6 z-10 w-full bg-white overflow-hidden">
        {/* 3D Particle Container */}
        <div
          ref={containerRef}
          className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none"
          style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
        >
          {particles.map((p) => (
            <div
              key={p.id}
              data-x={p.x}
              data-y={p.y}
              data-z={p.z}
              data-rot={p.rotation}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
              style={{
                width: p.size,
                height: p.size * 2,
                backgroundColor: p.color,
                willChange: "transform",
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                transform: `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotate(${p.rotation}deg)`,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Hero Content */}
          <div className="flex flex-col items-start text-left pointer-events-auto">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight drop-shadow-sm">
              Số hóa Quy trình <span className="text-[#0054a6]">VNPT</span> với
              Sức mạnh AI.
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-xl font-light leading-relaxed">
              Chuyển đổi hình ảnh vẽ tay, văn bản phức tạp thành sơ đồ luồng
              chuyên nghiệp trong vài giây. Giải pháp tối ưu hóa hiệu suất cho
              doanh nghiệp số.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                to="/DrawDiagram"
                className="px-8 py-4 rounded-xl bg-[#0054a6] text-white font-bold text-lg hover:bg-blue-800 transition-all shadow-xl hover:shadow-[0_10px_30px_rgba(0,84,166,0.4)] hover:-translate-y-1 text-center border border-transparent"
              >
                Bắt đầu vẽ AI ngay
              </Link>
              <a
                href="#features"
                className="px-8 py-4 rounded-xl bg-transparent text-slate-700 font-bold text-lg hover:text-slate-900 transition-all text-center hover:underline underline-offset-4 decoration-2 decoration-slate-300"
              >
                Tìm hiểu thêm
              </a>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="relative w-full h-[500px] pointer-events-none rounded-2xl hidden lg:block">
            {/* Main Floating Mockup */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-slate-100 shadow-2xl overflow-hidden animate-[float_6s_ease-in-out_infinite] z-20 flex flex-col">
              <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="ml-4 text-xs font-semibold text-slate-400">
                  VNPT SmartFlow Editor
                </div>
              </div>
              <div className="flex-1 p-6 relative bg-slate-50/50 flex items-center justify-center">
                {/* Mockup nodes for visual */}
                <div className="absolute top-10 left-10 w-32 h-16 bg-white border-2 border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-sm font-bold text-slate-600">
                  Start
                </div>
                <svg
                  className="absolute top-[72px] left-[168px] w-20 h-8"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,0 L80,30"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    fill="none"
                    className="animate-[dash_2s_linear_infinite]"
                    strokeDasharray="5,5"
                  />
                </svg>
                <div className="absolute top-24 left-44 w-40 h-16 bg-blue-50 border-2 border-[#0054a6] rounded-lg shadow-md flex items-center justify-center text-sm font-bold text-[#0054a6]">
                  AI Processing
                </div>
              </div>
            </div>

            {/* Floating Icons */}
            <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-[float_4s_ease-in-out_infinite_1s] z-30">
              <BrainCircuit className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="absolute top-1/2 -right-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-[float_5s_ease-in-out_infinite_2s] z-30">
              <Video className="w-8 h-8 text-rose-500" />
            </div>
            <div className="absolute -bottom-6 left-1/4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-[float_4.5s_ease-in-out_infinite_0.5s] z-30">
              <ImageIcon className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: The Magic - Trình diễn tính năng Video Gen */}
      <section
        id="features"
        className="py-24 bg-slate-50 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              AI nhận diện Quy trình từ mọi Nguồn.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Video Player Mockup */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-slate-900 aspect-video group">
              <video
                className="w-full h-full object-cover opacity-80 mix-blend-screen"
                autoPlay
                loop
                muted
                playsInline
                poster="/video-placeholder.jpg"
              >
                {/* Fallback to visual representation if no video sourc exists yet */}
                <source
                  src="https://cdn.dribbble.com/userupload/8276451/file/original-b1f8f7ced91eabfe1f725bb468332ad6.mov"
                  type="video/mp4"
                />
              </video>

              {/* Fake Nodes growing out of player */}
              <div className="absolute bottom-4 left-4 right-4 h-1/3 bg-gradient-to-t from-slate-900 to-transparent z-20 flex items-end justify-center pb-8 gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="px-4 py-2 bg-emerald-500/90 text-white rounded-lg text-xs font-bold shadow-lg animate-[slideUp_0.5s_ease-out_forwards] backdrop-blur-sm border border-emerald-400">
                  Nhận diện: Bảng trắng
                </div>
                <div className="px-4 py-2 bg-blue-500/90 text-white rounded-lg text-xs font-bold shadow-lg animate-[slideUp_0.5s_ease-out_0.2s_forwards] backdrop-blur-sm border border-blue-400">
                  Trích xuất Text...
                </div>
                <div className="px-4 py-2 bg-indigo-500/90 text-white rounded-lg text-xs font-bold shadow-lg animate-[slideUp_0.5s_ease-out_0.4s_forwards] backdrop-blur-sm border border-indigo-400">
                  Tạo Node
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-700 font-bold text-sm w-fit mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                Tính năng độc quyền
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-6 leading-tight">
                Phân tích Video quay cảnh vẽ sơ đồ thực tế.
              </h3>
              <p className="text-xl text-slate-600 leading-relaxed">
                SmartFlow AI tự động OCR text, nhận diện hình khối và logic mũi
                tên để sinh ra sơ đồ React Flow động ngay lập tức. Không còn
                phải vẽ lại sơ đồ từ các buổi họp bảng trắng!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Use Cases - Ứng dụng thực tiễn */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Ứng dụng thực tiễn trong Hệ sinh thái VNPT.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group bg-white p-10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col">
              <div className="w-16 h-16 bg-blue-50 text-[#0054a6] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">
                Số hóa tài liệu cũ
              </h4>
              <p className="text-slate-600 leading-relaxed text-lg">
                Chuyển đổi hàng ngàn sơ đồ PDF/ảnh cũ thành file JSON/PNG sắc
                nét một cách tuần tự và chuẩn xác.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-white p-10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">
                Hội họp & Đào tạo
              </h4>
              <p className="text-slate-600 leading-relaxed text-lg">
                Quay video buổi họp vẽ sơ đồ, AI tự động phân tích và lưu lại
                thành quy trình chuẩn hóa ngay lập tức.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-white p-10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Bot className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">
                AI Gợi ý Logic
              </h4>
              <p className="text-slate-600 leading-relaxed text-lg">
                AI tự phân tích quy trình và gợi ý các bước tối ưu hóa
                (Optimized suggestions) cho thiết kế luồng của bạn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Call to Action cuối trang */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-[#0054a6] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,84,166,0.5)]">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-10 max-w-3xl leading-tight">
                Sẵn sàng cách mạng hóa cách bạn quản lý quy trình?
              </h2>
              <Link
                to="/DrawDiagram"
                className="px-10 py-5 rounded-2xl bg-white text-[#0054a6] font-bold text-xl hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-1 hover:shadow-2xl"
              >
                Thử nghiệm SmartFlow AI Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Global styles for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -10; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Home;
