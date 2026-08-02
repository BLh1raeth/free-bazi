import type { Relation } from "@/lib/bazi";

export function RelationBadges({ relations, limit = 8 }: { relations: Relation[]; limit?: number }) {
  const meaningful = relations.filter((relation) => !["天干同类", "天干相生", "天干受生"].includes(relation.type));
  if (meaningful.length === 0) return <span className="small muted">当前层级未识别到合、冲、刑、害或破。</span>;
  return <div className="relation-list">{meaningful.slice(0, limit).map((relation, index) => <span className="badge" key={`${relation.type}-${relation.detail}-${index}`}>{relation.type} · {relation.detail}</span>)}</div>;
}
