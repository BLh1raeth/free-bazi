import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "元序｜八字排盘", template: "%s｜元序" },
  description:
    "简洁、免费的传统八字排盘工具。支持原局、大运、流年、流月、流日与流时。",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <header className="site-header">
          <div className="site-shell site-header__inner">
            <Link className="brand" href="/">
              <span className="brand-name">元序</span>
              <span className="brand-caption">八字排盘</span>
            </Link>
            <nav className="nav" aria-label="主导航">
              <Link href="/rules">规则</Link>
              <Link href="/privacy">隐私</Link>
              <Link href="/#chart-form">排盘</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="site-shell footer-inner">
            <span>元序 · 永久免费 · 数据留在本机</span>
            <span>传统民俗历法工具，仅供文化研究与娱乐参考</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
