import React, { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthContext } from "../../context/AuthContext";
import { authApi } from "../../services/authApi";
import { useGoogleLogin } from "@react-oauth/google";
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
    // useGoogleLogin trả về access_token, không phải credential (id_token)
    // Ta dùng access_token để lấy thông tin user từ Google, sau đó gửi về backend
    const token = credentialResponse.access_token || credentialResponse.credential;
    if (!token) return;
    try {
      const res  = await authApi.googleLogin(token);
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

  // useGoogleLogin dùng popup trực tiếp, KHÔNG dùng iframe
  // → Tránh hoàn toàn lỗi 403 "origin not allowed" trên button iframe
  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error("Xác thực Google bị từ chối hoặc có lỗi."),
    flow: "implicit",
  });

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

            {/* Google Login — dùng popup trực tiếp, không dùng iframe */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="flex items-center gap-3 px-6 py-3 bg-white text-gray-700 font-semibold rounded-full shadow-md hover:shadow-lg hover:bg-gray-50 active:scale-95 transition-all duration-150 border border-gray-200"
              >
                {/* Google SVG icon */}
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
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
