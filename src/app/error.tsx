"use client";
import { GlassCard, PrimaryButton } from "@/components/ui";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="site-shell content-page"><GlassCard className="empty-state"><h1>页面暂时无法显示</h1><p className="muted">请重试；若问题持续，请返回首页重新排盘。</p><PrimaryButton type="button" onClick={reset}>重新加载</PrimaryButton></GlassCard></div>; }
