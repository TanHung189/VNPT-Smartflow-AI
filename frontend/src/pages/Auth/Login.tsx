import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result) navigate("/DrawDiagram");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
      {/* Các khối màu trang trí phía sau (Blur Background) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Card chính với hiệu ứng Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-tr from-blue-500 to-blue-700 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/40">
              <span className="text-white text-2xl font-black italic">
                VNPT
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Chào mừng trở lại
            </h2>
            <p className="text-slate-400 mt-2 text-sm">
              Hệ thống SmartFlow AI - Sẵn sàng bứt phá
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">
                Email công vụ
              </label>
              <input
                type="email"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-white placeholder:text-slate-500"
                placeholder="hung@vnpt.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">
                Mật khẩu
              </label>
              <input
                type="password"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-white placeholder:text-slate-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? "Đang xác thực..." : "Đăng Nhập"}
            </button>
          </form>

          {/* Divider: "Hoặc" */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1e293b] px-2 text-slate-500">
                Hoặc tiếp tục với
              </span>
            </div>
          </div>

          {/* Nút Đăng nhập Google */}
          <button
            type="button"
            className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Đăng nhập bằng Google
          </button>

          <p className="mt-8 text-center text-sm text-slate-500">
            Chưa có tài khoản?{""}
            <button className="text-blue-400 font-bold hover:underline">
              Liên hệ quản trị
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
