import Link from "next/link";
import { BirthForm } from "@/components/birth-form";
import { ElementText } from "@/components/chart/element-text";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="site-shell">
          <p className="hero-kicker">八字 · 节气 · 时间</p>
          <h1>
            把出生时间，
            <br />
            还原成一张清楚的命盘
          </h1>
          <p className="hero-copy">
            公历或农历输入，查看原局、大运与逐层流运。无需登录，数据默认只留在本机。
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#chart-form">
              开始排盘
            </Link>
          </div>
          <p className="free-promise">永久免费 · 无次数限制 · 免费导出</p>
          <div className="preview" aria-label="四柱排盘预览">
            <div className="preview-item">
              <small>年柱</small>
              <strong>
                <ElementText element="木">甲</ElementText>
                <ElementText element="土">辰</ElementText>
              </strong>
            </div>
            <div className="preview-item">
              <small>月柱</small>
              <strong>
                <ElementText element="火">丙</ElementText>
                <ElementText element="木">寅</ElementText>
              </strong>
            </div>
            <div className="preview-item">
              <small>日柱</small>
              <strong>
                <ElementText element="金">辛</ElementText>
                <ElementText element="水">亥</ElementText>
              </strong>
            </div>
            <div className="preview-item">
              <small>时柱</small>
              <strong>
                <ElementText element="土">戊</ElementText>
                <ElementText element="水">子</ElementText>
              </strong>
            </div>
          </div>
        </div>
      </section>
      <section id="chart-form" className="form-section">
        <div className="site-shell">
          <p className="section-kicker">开始</p>
          <h2 className="section-title">出生信息</h2>
          <BirthForm />
        </div>
      </section>
    </>
  );
}
