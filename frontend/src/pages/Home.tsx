import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

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
      color: Math.random() > 0.5 ? "#2563eb" : "#7c3aed", // Blue or Purple (như ảnh reference)
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
    <div className="w-full min-h-screen overflow-x-hidden bg-white relative font-sans scroll-smooth">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center p-6 z-10 w-full ">
        {/* 3D Particle Container - Google Antigravity Style */}
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
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
              style={{
                width: p.size,
                height: p.size * 2, // Tạo thành các nét gạch nhẹ (strokes)
                backgroundColor: p.color,
                willChange: "transform", // Bật GPU Acceleration
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                transform: `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotate(${p.rotation}deg)`,
              }}
            />
          ))}
        </div>

        {/* Hero Content Centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 pointer-events-none">
          <h1 className="text-6xl md:text-8xl tracking-tight text-slate-900 mb-6 flex items-center gap-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-indigo-600 font-bold italic">
              VNPT
            </span>
            <span className="font-medium">SmartFlow</span>
          </h1>

          <h2 className="text-4xl text-slate-800 mb-6 text-center max-w-2xl font-light">
            You have successfully authenticated.
          </h2>

          <p className="text-slate-500 mb-12 max-w-lg text-center font-medium">
            Dự án tối ưu hóa với hiệu ứng{" "}
            <span className="text-blue-600">3D Mouse Parallax</span> và{" "}
            <span className="text-indigo-600">GPU Acceleration</span>. Vẽ quy
            trình nghiệp vụ như thể nó trôi nổi trong không gian.
          </p>

          <div className="flex gap-4 pointer-events-auto">
            <Link
              to="/DrawDiagram"
              className="px-8 py-4 rounded-full bg-slate-900 text-white font-bold text-lg hover:bg-blue-600 transition-all shadow-xl hover:shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:-translate-y-1"
            >
              Trải nghiệm Không trọng lực
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-full bg-slate-50 text-slate-900 border border-slate-200 font-bold text-lg hover:bg-slate-100 transition-colors shadow-sm"
            >
              Tài khoản (OAuth2)
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Section: Tính năng nổi bật */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Tính năng nổi bật
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-4">
                Vẽ bằng AI
              </h4>
              <p className="text-slate-600">
                Chỉ cần tải lên hình ảnh hoặc nhập văn bản, AI sẽ tự động tạo sơ
                đồ quy trình chuẩn React Flow trong vài giây. Tiết kiệm 90% thời
                gian vẽ thủ công.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-4">
                Templates phong phú
              </h4>
              <p className="text-slate-600">
                Hàng trăm mẫu sơ đồ quy trình nghiệp vụ có sẵn cho nhiều tổ
                chức: Kinh Doanh, Chăm sóc Khách hàng, IT. Chỉ cần chọn và sử
                dụng.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-4">
                Vẽ tay Tự do
              </h4>
              <p className="text-slate-600">
                Trải nghiệm thao tác mượt mà với công cụ Canvas hiện đại. Hỗ trợ
                đầy đủ phím tắt, kéo thả node và thao tác xuất file dễ dàng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section: Quy trình hoạt động */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-slate-900 mb-16">
            Quy trình hoạt động
          </h3>
          <div className="flex flex-col md:flex-row gap-12 relative">
            <div className="hidden md:block absolute top-[28px] left-1/6 w-[66%] h-0.5 bg-blue-100 z-0 mx-auto right-0"></div>

            <div className="flex-1 relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-xl font-bold text-blue-600 mb-6 shadow-md shadow-blue-100">
                1
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-3">
                Tải lên dữ liệu
              </h4>
              <p className="text-slate-500">
                Người dùng nhập văn bản Text hoặc tải Hình Ảnh chứa sơ đồ lên để
                hệ thống phân tích.
              </p>
            </div>

            <div className="flex-1 relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center text-xl font-bold text-indigo-600 mb-6 shadow-md shadow-indigo-100">
                2
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-3">
                AI Phân tích
              </h4>
              <p className="text-slate-500">
                Mô hình AI đọc ngôn ngữ, trích xuất cấu trúc các bước, người đại
                diện và chuyển sang dạng luồng.
              </p>
            </div>

            <div className="flex-1 relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-white border-2 border-emerald-500 rounded-full flex items-center justify-center text-xl font-bold text-emerald-600 mb-6 shadow-md shadow-emerald-100">
                3
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-3">
                Xuất file & Chia sẻ
              </h4>
              <p className="text-slate-500">
                Thêm ghi chú thủ công, xuất file ngay trên Toolbar với định dạng
                PDF chất lượng cao (DPRx2).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section: Bảng giá */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Lựa chọn Gói dịch vụ</h3>
            <p className="text-slate-400">
              Thiết kế tối ưu cho trải nghiệm người dùng cuối lẫn đội ngũ quản
              trị cấp cao.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700">
              <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Cho Nhân viên
              </span>
              <h4 className="text-4xl font-bold mt-6 mb-2">Free</h4>
              <p className="text-slate-400 mb-8">Trải nghiệm cá nhân hóa.</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>{" "}
                  <span className="text-slate-300">
                    Biên dịch quy trình (50 lần/tháng)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>{" "}
                  <span className="text-slate-300">
                    Vẽ canvas tự do không giới hạn
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>{" "}
                  <span className="text-slate-300">
                    Xuất file chuẩn JPG, PNG, PDF sắc nét
                  </span>
                </li>
              </ul>
              <Link
                to="/DrawDiagram"
                className="block text-center w-full py-4 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                Bắt đầu ngay
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 rounded-3xl border border-blue-500 shadow-2xl relative overflow-hidden">
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Cho Ban Quản Trị
              </span>
              <h4 className="text-4xl font-bold mt-6 mb-2">Pro (Admin)</h4>
              <p className="text-blue-100 mb-8">
                Toàn quyền kiểm soát và mở rộng quy mô tổ chức.
              </p>
              <ul className="space-y-4 mb-8 relative z-10">
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>{" "}
                  <span className="text-blue-50">
                    API AI không giới hạn request
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>{" "}
                  <span className="text-blue-50">
                    Quản lý kho Templates dùng chung cho VNPT
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>{" "}
                  <span className="text-blue-50">
                    Báo cáo & Thống kê lưu lượng sử dụng chi tiết
                  </span>
                </li>
              </ul>
              <Link
                to="/login"
                className="block text-center w-full py-4 rounded-xl font-bold bg-white text-indigo-600 hover:bg-slate-50 transition-colors relative z-10"
              >
                Liên hệ nâng cấp
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-white text-center">
        <h2 className="text-4xl font-bold text-slate-800 mb-8">
          Bạn đã sẵn sàng bước vào không gian số hoá?
        </h2>
        <Link
          to="/DrawDiagram"
          className="inline-block px-10 py-5 rounded-full bg-blue-600 text-white font-bold text-xl hover:bg-indigo-600 transition-all shadow-xl hover:-translate-y-1"
        >
          Bắt đầu số hóa ngay
        </Link>
      </section>
    </div>
  );
};

export default Home;
