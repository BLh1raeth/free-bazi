import Link from "next/link";
import { BirthForm } from "@/components/birth-form";
import { GlassCard } from "@/components/ui";

export default function HomePage() {
  return <>
    <section className="hero"><div className="site-shell">
      <span className="eyebrow">本地计算 · 无需登录 · 永久免费</span>
      <h1>免费、清晰、准确的<br /><span>传统八字排盘工具</span></h1>
      <p className="hero-copy">从原局、大运到流年、流月、流日与流时，按节气逐层查看。出生信息默认只留在你的浏览器。</p>
      <div className="hero-actions"><Link className="button button-primary" href="#chart-form">开始排盘</Link><Link className="button button-secondary" href="/rules">先看计算规则</Link></div>
      <p className="free-promise">所有排盘、复制、图片、PDF 与打印功能免费开放</p>
      <div className="glass preview" aria-label="四柱排盘预览">{[["年柱","甲辰"],["月柱","丙寅"],["日柱","辛亥"],["时柱","戊子"]].map(([label,value]) => <div className="preview-item" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    </div></section>
    <section className="section"><div className="site-shell"><h2 className="section-title">把复杂规则，呈现得清楚</h2><p className="section-copy">不输出绝对化吉凶结论，只客观展示传统历法规则与数据来源。</p><div className="feature-grid">
      <GlassCard className="feature-card"><span className="eyebrow">历法</span><h3>节令精确交接</h3><p>年柱以立春时刻、月柱以十二节时刻为界，并换算出生地时区。</p></GlassCard>
      <GlassCard className="feature-card"><span className="eyebrow">时间轴</span><h3>逐级懒计算</h3><p>先看流年，再按需生成流月、流日和十二流时，不预算无用数据。</p></GlassCard>
      <GlassCard className="feature-card"><span className="eyebrow">隐私</span><h3>浏览器本地完成</h3><p>无账号、无外部分析接口；只有主动选择时才长期保存本地命盘。</p></GlassCard>
    </div></div></section>
    <section id="chart-form" className="form-section"><div className="site-shell"><h2 className="section-title">填写出生信息</h2><p className="section-copy">支持 1900–2100 年公历/农历。具体时刻未知时不会生成确定时柱。</p><BirthForm /></div></section>
  </>;
}
