import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "清岚排盘｜永久免费八字排盘", template: "%s｜清岚排盘" },
  description: "免费、清晰的传统八字排盘工具。支持原局、大运、流年、流月、流日与流时。",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f4f8fc" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <header className="site-header">
          <div className="site-shell site-header__inner">
            <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">岚</span><span>清岚排盘</span></Link>
            <nav className="nav" aria-label="主导航"><Link href="/rules">计算规则</Link><Link href="/privacy">隐私</Link><Link href="/about">关于</Link><Link href="/#chart-form">开始排盘</Link></nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="site-shell footer-inner"><span>本站所有排盘功能永久免费，无会员、无付费解锁、无次数限制。</span><span>本工具基于传统民俗历法规则生成结果，仅供文化研究与娱乐参考。</span></div>
        </footer>
      </body>
    </html>
  );
}
