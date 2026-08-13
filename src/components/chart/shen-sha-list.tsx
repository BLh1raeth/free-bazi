import { SHEN_SHA_STANDARD, type ShenSha } from "@/lib/bazi";

export function ShenShaList({ items }: { items: ShenSha[] }) {
  if (items.length === 0) return null;

  return (
    <section className="shen-sha-section" aria-labelledby="shen-sha-title">
      <div className="chart-section__head">
        <h3 id="shen-sha-title">神煞</h3>
        <span className="small muted">{SHEN_SHA_STANDARD.name}</span>
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
        本版天乙、禄神取日干；驿马、华盖、将星查年支与日支。咸池因古籍另有纳音条件，本版不以简表冒充。仅展示规则命中，不据此生成吉凶结论。
      </p>
    </section>
  );
}
