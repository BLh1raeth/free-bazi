import Link from "next/link";
import { GlassCard } from "@/components/ui";
export default function NotFound() { return <div className="site-shell content-page"><GlassCard className="empty-state"><span className="eyebrow">404</span><h1>这一页不在时间轴上</h1><p className="muted">链接可能已经失效，或本地命盘状态已清除。</p><Link className="button button-primary" href="/">返回首页</Link></GlassCard></div>; }
