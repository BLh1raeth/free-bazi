import { GlassCard } from "@/components/ui";
export const metadata = { title: "关于" };
export default function AboutPage() { return <div className="site-shell content-page"><GlassCard className="prose"><span className="eyebrow">永久免费</span><h1>关于清岚排盘</h1><p>清岚排盘是一个完全免费、无需注册的传统历法工具。原局、大运、流年、流月、流日、流时以及导出功能均不设置会员、充值、试看或次数限制。</p><h2>我们不做什么</h2><p>本站不提供虚假的“AI 精准预测”，不承诺百分之百准确，也不把结果作为健康、疾病、投资、法律或人生重大决策依据。</p><h2>开源与来源</h2><p>界面为原创设计，没有复制其他排盘网站或 Apple 的图标、字体文件和受保护素材。历法库及规则来源、许可和已知限制均记录在项目文档中。</p><h2>免责声明</h2><p>本工具基于传统民俗历法规则生成结果，仅供文化研究与娱乐参考。</p></GlassCard></div>; }
