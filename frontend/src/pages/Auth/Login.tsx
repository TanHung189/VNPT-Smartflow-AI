import React, { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthContext } from "../../context/AuthContext";
import { authApi } from "../../services/authApi";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";

// ─── SVG Logo VNPT ────────────────────────────────────────────
const VNPTLogo = () => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
    <text x="2" y="32" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="34"
      fill="white" letterSpacing="-1">VNPT</text>
    <rect x="0" y="36" width="120" height="3" rx="1.5" fill="#3b82f6" opacity="0.8"/>
  </svg>
);

const Login: React.FC = () => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();
  const { setUser } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result?.user) {
      const user = result.user;
      const userToSet = {
        ...user,
        id:   user.id_nguoi_dung,
        name: user.ten_nguoi_dung,
        role: user.ten_vai_tro === "quan_tri" ? "admin" : "user",
      };
      setUser(userToSet);
      localStorage.setItem("user", JSON.stringify(userToSet));
      
      toast.success("Đăng nhập thành công!");
      if (user.ten_vai_tro === "quan_tri") navigate("/admin");
      else navigate("/dashboard");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    try {
      const res  = await authApi.googleLogin(credentialResponse.credential);
      const data = await res.json();

      if (res.ok && data.access_token) {
        const user = data.user;
        const userToSet = {
          ...user,
          id:   user.id_nguoi_dung,
          name: user.ten_nguoi_dung,
          role: user.ten_vai_tro === "quan_tri" ? "admin" : "user",
        };
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user",  JSON.stringify(userToSet));
        setUser(userToSet);
        toast.success("Đăng nhập Google thành công!");
        if (user.ten_vai_tro === "quan_tri") navigate("/admin");
        else navigate("/dashboard");
      } else {
        toast.error(`Đăng nhập Google thất bại: ${data.detail || "Lỗi không xác định"}`);
      }
    } catch {
      toast.error("Lỗi kết nối tới máy chủ backend.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0a1628] p-4 relative overflow-hidden"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* ── Ambient light blobs (pointer-events:none để không block input) ── */}
      <div
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
        className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-blue-600/15 rounded-full blur-[130px]"
      />
      <div
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
        className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-700/15 rounded-full blur-[130px]"
      />
      {/* Subtle grid texture */}
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
      <div className="w-full max-w-md relative z-10">
        <Card className="bg-white/[0.06] backdrop-blur-2xl border-white/10 p-2 sm:p-4 rounded-[2rem] shadow-2xl shadow-black/40 text-white">
          <CardHeader className="text-center mb-2 space-y-3">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-[#0066cc] to-[#004b91] px-5 py-3 rounded-2xl shadow-lg shadow-blue-700/40 inline-flex items-center justify-center">
                <VNPTLogo />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight mt-4 text-white">
                Đăng nhập hệ thống
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm mt-1">
                Hệ thống quản lý quy trình Smartflow – VNPT nội bộ
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Email công vụ
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-6 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 transition-all text-base"
                  placeholder="ten.nhanvien@vnpt.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Mật khẩu
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full px-4 py-6 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 transition-all text-base"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 mt-2 bg-gradient-to-r from-[#0066cc] to-[#004b91] hover:from-blue-500 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-700/30 transition-all active:scale-[0.98] disabled:opacity-60 text-base"
              >
                {loading ? "Đang xác thực..." : "Đăng Nhập"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0f1f3d] px-3 text-xs text-slate-400 uppercase tracking-widest rounded-full border border-white/5">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Xác thực Google bị từ chối hoặc có lỗi.")}
                theme="filled_black"
                size="large"
                shape="pill"
                text="continue_with"
                auto_select={false}
                use_fedcm_for_prompt={false}
              />
            </div>
          </CardContent>

          <CardFooter className="flex-col pb-6">
            <p className="text-center text-sm text-slate-500 mt-2">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                Đăng ký ngay
              </Link>
            </p>
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

export default Login;
