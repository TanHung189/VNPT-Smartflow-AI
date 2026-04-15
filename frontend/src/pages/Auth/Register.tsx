import React, { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthContext } from "../../context/AuthContext";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";

// ─── SVG Logo VNPT (dùng chung) ────────────────────────────────
const VNPTLogo = () => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
    <text x="2" y="32" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="34"
      fill="white" letterSpacing="-1">VNPT</text>
    <rect x="0" y="36" width="120" height="3" rx="1.5" fill="#3b82f6" opacity="0.8"/>
  </svg>
);

const Register: React.FC = () => {
  const [tenNguoiDung,  setTenNguoiDung]  = useState("");
  const [email,          setEmail]          = useState("");
  const [matKhau,        setMatKhau]        = useState("");
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
  const [localError,     setLocalError]     = useState("");

  const { register, loading, error } = useAuth();
  const { setUser }                  = useAuthContext();
  const navigate                     = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (matKhau !== xacNhanMatKhau) {
      setLocalError("Mật khẩu xác nhận không khớp!");
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (matKhau.length < 6) {
      setLocalError("Mật khẩu phải có ít nhất 6 ký tự!");
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    // ✅ Truyền đúng tên tham số khớp với useAuth → TaoNguoiDung
    const result = await register(tenNguoiDung, email, matKhau);

    if (result?.user) {
      // Nếu backend trả token ngay → tự động đăng nhập
      const user = result.user;
      const userToSet = {
        ...user,
        id:   user.id_nguoi_dung,
        name: user.ten_nguoi_dung,
        role: user.ten_vai_tro === "quan_tri" ? "admin" : "user",
      };
      setUser(userToSet);
      localStorage.setItem("token", result.access_token);
      localStorage.setItem("user",  JSON.stringify(userToSet));
      toast.success("Tạo tài khoản và đăng nhập thành công!");
      navigate("/dashboard");
    } else if (result) {
      // Nếu backend không trả user (chỉ trả token) → chuyển về login
      toast.success("Tạo tài khoản thành công! Vui lòng đăng nhập.");
      navigate("/login");
    }
  };

  const displayError = error || localError;

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0a1628] p-4 relative overflow-hidden"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* ── Ambient light blobs — pointer-events:none để không block input ── */}
      <div
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
        className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] bg-blue-600/15 rounded-full blur-[130px]"
      />
      <div
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
        className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-700/15 rounded-full blur-[110px]"
      />
      {/* Subtle grid overlay */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        className="absolute inset-0"
      />

      {/* ── Main Card ── */}
      <div className="w-full max-w-lg relative z-10">
        <Card className="bg-white/[0.06] backdrop-blur-2xl border-white/10 p-2 sm:p-4 rounded-[2rem] shadow-2xl shadow-black/40 text-white">
          <CardHeader className="text-center mb-2 space-y-3">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-[#0066cc] to-[#004b91] px-5 py-3 rounded-2xl shadow-lg shadow-blue-700/40 inline-flex items-center justify-center">
                <VNPTLogo />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight mt-4 text-white">
                Tạo tài khoản nội bộ
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm mt-1">
                Hệ thống quản lý quy trình Smartflow – VNPT nội bộ
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {/* Error Banner */}
            {displayError && (
              <div className="mb-5 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                {displayError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Họ và Tên */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-ten" className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Họ và Tên
                </Label>
                <Input
                  id="reg-ten"
                  type="text"
                  autoComplete="name"
                  className="w-full px-4 py-6 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 transition-all text-base"
                  placeholder="Bùi Đổ Tấn Hưng"
                  value={tenNguoiDung}
                  onChange={(e) => setTenNguoiDung(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Email công vụ
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-6 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 transition-all text-base"
                  placeholder="ten.nhanvien@vnpt.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Mật khẩu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password" className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Mật khẩu
                  </Label>
                  <Input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    className="w-full px-4 py-6 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 transition-all text-base"
                    placeholder="••••••••"
                    value={matKhau}
                    onChange={(e) => setMatKhau(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-confirm" className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Xác nhận
                  </Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    autoComplete="new-password"
                    className="w-full px-4 py-6 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 transition-all text-base"
                    placeholder="••••••••"
                    value={xacNhanMatKhau}
                    onChange={(e) => setXacNhanMatKhau(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Vai trò hint */}
              <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-2">
                <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                Tài khoản sẽ được cấp vai trò <span className="text-blue-400 font-semibold">Nhân viên</span> mặc định.
              </p>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 mt-1 bg-gradient-to-r from-[#0066cc] to-[#004b91] hover:from-blue-500 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-700/30 transition-all active:scale-[0.98] disabled:opacity-60 text-base"
              >
                {loading ? "Đang tạo tài khoản..." : "Đăng Ký Tài Khoản"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col pb-6">
            <div className="w-full mt-4 pt-6 border-t border-white/5 text-center">
              <p className="text-slate-500 text-sm">
                Đã là thành viên SmartFlow?{" "}
                <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Branding footer */}
        <p className="mt-5 text-center text-xs text-slate-500/80">
          © 2025 Tập đoàn Bưu chính Viễn thông Việt Nam · VNPT
        </p>
      </div>
    </div>
  );
};

export default Register;
