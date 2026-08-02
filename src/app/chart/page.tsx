import { Suspense } from "react";
import { ChartClient } from "@/components/chart/chart-client";

export const metadata = { title: "我的命盘" };

export default function ChartPage() {
  return <Suspense fallback={<div className="site-shell chart-layout"><div className="glass glass-card empty-state">正在恢复本地命盘…</div></div>}><ChartClient /></Suspense>;
}
