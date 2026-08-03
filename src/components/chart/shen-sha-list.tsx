import type { ShenSha } from "@/lib/bazi";

export function ShenShaList({ items }: { items: ShenSha[] }) {
  return (
    <section className="shen-sha-section" aria-labelledby="shen-sha-title">
      <div className="chart-section__head">
        <h3 id="shen-sha-title">神煞</h3>
        <span className="small muted">常用规则客观列示</span>
      </div>
      {items.length > 0 ? (
        <div className="shen-sha-grid">
          {items.map((item) => (
            <div
              className="shen-sha-item"
              key={`${item.name}-${item.targetPillar}`}
            >
              <strong>{item.name}</strong>
              <span>
                {item.targetPillar} · {item.targetBranch}
              </span>
              <small>
                {item.basis} · {item.rule}
              </small>
            </div>
          ))}
        </div>
      ) : (
        <p className="small muted">本命四柱中未见当前规则命中。</p>
      )}
      <p className="small muted shen-sha-note">
        神煞流派差异较大，仅展示规则命中，不据此生成吉凶结论。
      </p>
    </section>
  );
}
