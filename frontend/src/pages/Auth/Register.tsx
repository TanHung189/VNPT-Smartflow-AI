import React, { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth"; // Gọi chung từ useAuth

const Register: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Lấy hàm register, trạng thái loading và error từ hook dùng chung
  const { register, loading, error } = useAuth();
  const [localError, setLocalError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");

    // Kiểm tra khớp mật khẩu trước khi gửi lên Backend
    if (password !== confirmPassword) {
      setLocalError("Mật khẩu xác nhận không khớp!");
      return;
    }

    const result = await register(username, email, password);

    if (result) {
      alert(
        "Đăng ký tài khoản thành công! Hệ thống sẽ chuyển bạn sang trang Đăng nhập.",
      );
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-y-auto overflow-x-hidden font-sans">
      {/* Hiệu ứng ánh sáng nền (Blur Background) */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-lg relative z-10 transition-all duration-500">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-tr from-blue-600 to-blue-400 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <span className="text-white text-2xl font-black italic">
                VNPT
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Tạo tài khoản mới
            </h2>
            <p className="text-slate-400 mt-2 text-sm">
              Gia nhập hệ thống vẽ sơ đồ thông minh AI
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hiển thị lỗi từ Backend hoặc lỗi nhập liệu local */}
            {(error || localError) && (
              <div className="p-3 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl text-center animate-pulse">
                {error || localError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-widest">
                Họ và Tên
              </label>
              <input
                type="text"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-white placeholder:text-slate-600"
                placeholder="Nguyễn Văn A"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-widest">
                Email công vụ
              </label>
              <input
                type="email"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-white placeholder:text-slate-600"
                placeholder="hung@vnpt.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-widest">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-white placeholder:text-slate-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-widest">
                  Xác nhận
                </label>
                <input
                  type="password"
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-white placeholder:text-slate-600"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg transition-all active:scale-[0.98] ${
                  loading
                    ? "bg-slate-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang tạo tài khoản...
                  </span>
                ) : (
                  "Đăng Ký Tài Khoản"
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Đã là thành viên SmartFlow?{" "}
              <Link
                to="/login"
                className="text-blue-400 font-bold hover:text-blue-300 transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
