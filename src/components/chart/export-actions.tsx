"use client";

import { useState } from "react";
import type { BaziChart } from "@/lib/bazi";
import { PrimaryButton, SecondaryButton } from "../ui";

function download(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

function chartText(chart: BaziChart, anonymous: boolean): string {
  const pillars = chart.pillars.map((pillar) => pillar?.ganZhi ?? "时柱未知").join("  ");
  const luck = chart.luckCycle?.items.map((item) => `${item.pillar.ganZhi} ${item.startYear}-${item.endYear}`).join("；") ?? "未生成";
  return `清岚排盘\n${anonymous ? "匿名命盘" : chart.input.name || "未填写称呼"}\n${chart.calendar.solarText}\n${chart.calendar.lunarText}\n四柱：${pillars}\n大运：${luck}\n规则：${chart.rules.join(" ")}\n生成时间：${new Date().toLocaleString("zh-CN")}\n本工具基于传统民俗历法规则生成结果，仅供文化研究与娱乐参考。`;
}

export function ExportActions({ chart, targetId, anonymous, setAnonymous }: { chart: BaziChart; targetId: string; anonymous: boolean; setAnonymous: (value: boolean) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const filename = `清岚排盘-${new Date().toISOString().slice(0, 10)}`;
  async function copy(text: string) { await navigator.clipboard.writeText(text); setBusy("已复制"); window.setTimeout(() => setBusy(null), 1200); }
  async function image(kind: "png" | "pdf") {
    const node = document.getElementById(targetId);
    if (!node) return;
    setBusy(kind);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, { pixelRatio: Math.min(2, window.devicePixelRatio || 1), backgroundColor: "#f4f8fc", cacheBust: true });
      if (kind === "png") download(dataUrl, `${filename}.png`);
      else {
        const { jsPDF } = await import("jspdf");
        const image = new Image();
        image.src = dataUrl;
        await image.decode();
        const width = 210;
        const height = width * (image.height / image.width);
        const pdf = new jsPDF({ orientation: height > width ? "portrait" : "landscape", unit: "mm", format: [width, Math.max(297, height)] });
        pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
        pdf.save(`${filename}.pdf`);
      }
    } finally { setBusy(null); }
  }
  return <>
    <label className="check"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />匿名导出（隐藏称呼）</label>
    <div className="export-actions" style={{ marginTop: 16 }}>
      <PrimaryButton type="button" onClick={() => copy(chartText(chart, anonymous))}>{busy === "已复制" ? "已复制" : "复制完整结果"}</PrimaryButton>
      <SecondaryButton type="button" onClick={() => copy(chart.pillars.map((pillar) => pillar?.ganZhi ?? "未知").join(" "))}>复制四柱</SecondaryButton>
      <SecondaryButton type="button" disabled={busy !== null} onClick={() => image("png")}>{busy === "png" ? "生成中…" : "导出 PNG / 长图"}</SecondaryButton>
      <SecondaryButton type="button" disabled={busy !== null} onClick={() => image("pdf")}>{busy === "pdf" ? "生成中…" : "导出 PDF"}</SecondaryButton>
      <SecondaryButton type="button" onClick={() => window.print()}>浏览器打印</SecondaryButton>
    </div>
    <p className="small muted">图片与 PDF 库仅在点击后动态加载；导出不含二维码、广告或付费水印。</p>
  </>;
}
