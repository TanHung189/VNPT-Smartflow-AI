import React from "react";
import { Link } from "react-router-dom";
import { MousePointer2, Github, Facebook, Mail, Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Cột 1: Brand & Intro */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-[#0062ff] rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                <MousePointer2 className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tighter">
                VNPT <span className="text-[#0062ff]">SmartFlow</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Giải pháp tối ưu hóa và trực quan hóa quy trình nghiệp vụ bằng trí
              tuệ nhân tạo thế hệ mới. Phát triển bởi đội ngũ thực tập sinh
              Mekong ITP.
            </p>
            <div className="flex items-center gap-4">
              <SocialIcon
                icon={<Github className="w-4 h-4" />}
                href="https://github.com/TanHung189"
              />
              <SocialIcon icon={<Facebook className="w-4 h-4" />} href="#" />
              <SocialIcon icon={<Mail className="w-4 h-4" />} href="#" />
            </div>
          </div>

          {/* Cột 2: Sản phẩm */}
          <div>
            <h4 className="text-slate-900 font-bold text-sm mb-6 uppercase tracking-widest">
              Sản phẩm
            </h4>
            <ul className="space-y-4">
              <FooterLink to="/editor" label="Trình vẽ AI" />
              <FooterLink to="/dashboard" label="Kho lưu trữ" />
              <FooterLink to="#" label="Mẫu quy trình" />
              <FooterLink to="#" label="Tài liệu API" />
            </ul>
          </div>

          {/* Cột 3: Đơn vị công tác */}
          <div>
            <h4 className="text-slate-900 font-bold text-sm mb-6 uppercase tracking-widest">
              Đơn vị
            </h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li className="hover:text-[#0062ff] transition-colors cursor-default">
                VNPT An Giang
              </li>
              <li className="hover:text-[#0062ff] transition-colors cursor-default">
                Mekong ITP Center
              </li>
              <li className="hover:text-[#0062ff] transition-colors cursor-default">
                Đại học An Giang (AGU)
              </li>
              <li className="hover:text-[#0062ff] transition-colors cursor-default">
                Phòng Giải pháp
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ nhanh */}
          <div>
            <h4 className="text-slate-900 font-bold text-sm mb-6 uppercase tracking-widest">
              Liên hệ
            </h4>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <p className="text-xs text-slate-600 font-medium mb-4">
                Bạn có ý tưởng mới cho SmartFlow?
              </p>
              <button className="w-full bg-white text-slate-900 border border-slate-200 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
                Gửi phản hồi ngay
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[12px] text-slate-400 font-medium">
            © 2026 Bùi Đổ Tấn Hưng - DH23TH3. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[12px] text-slate-400 font-medium">
            <a href="#" className="hover:text-[#0062ff]">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-[#0062ff]">
              Điều khoản sử dụng
            </a>
            <div className="flex items-center gap-1.5 ml-4">
              <Globe className="w-3 h-3" />
              <span>Tiếng Việt</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Component con cho Link
const FooterLink = ({ to, label }: { to: string; label: string }) => (
  <li>
    <Link
      to={to}
      className="text-sm text-slate-500 hover:text-[#0062ff] transition-colors"
    >
      {label}
    </Link>
  </li>
);

// Component con cho Social Icon
const SocialIcon = ({ icon, href }: { icon: any; href: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0062ff] hover:border-[#0062ff] hover:bg-blue-50 transition-all"
  >
    {icon}
  </a>
);

export default Footer;
