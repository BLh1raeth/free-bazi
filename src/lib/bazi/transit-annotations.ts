import { isBranchClash, isStemControl } from "./relations";
import type { BaziChart, FlowYear, Pillar } from "./types";

/** 只标记可由当前统一数据模型直接验证的流年结构，不延伸为吉凶判断。 */
export function flowYearAnnotations(
  year: FlowYear,
  chart: BaziChart,
  luck: Pillar | null,
): string[] {
  const annotations: string[] = [];
  if (luck?.ganZhi === year.pillar.ganZhi) annotations.push("岁运并临");
  for (const natal of chart.pillars.filter((pillar): pillar is Pillar => pillar !== null)) {
    if (natal.ganZhi === year.pillar.ganZhi) annotations.push(`伏吟·${natal.label}`);
    if (
      isBranchClash(year.pillar.branch, natal.branch) &&
      (isStemControl(year.pillar, natal) || isStemControl(natal, year.pillar))
    ) {
      annotations.push(`天克地冲·${natal.label}`);
    }
  }
  if (chart.luckCycle?.items.some((item) => item.startYear === year.year)) annotations.push("换大运");
  return annotations;
}
