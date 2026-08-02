import { Temporal } from "@js-temporal/polyfill";
import { getJieBoundaries } from "./calendar-adapter";
import { createPillar, parseGanZhi, shiftGanZhi } from "./pillars";
import { STEMS, type Gender, type LuckCycleResult, type Pillar, type Stem } from "./types";

export function getLuckDirection(yearGanZhi: string, gender: Gender): { forward: boolean; reason: string } | null {
  if (gender === "unspecified") return null;
  const yearStem = parseGanZhi(yearGanZhi).stem;
  const yangYear = STEMS.indexOf(yearStem) % 2 === 0;
  const forward = (gender === "male" && yangYear) || (gender === "female" && !yangYear);
  return { forward, reason: `${yangYear ? "阳" : "阴"}年干${yearStem}，${gender === "male" ? "男" : "女"}命${forward ? "顺排" : "逆排"}` };
}

export function calculateLuckCycle(params: {
  birthInstant: Temporal.Instant;
  birthDate: Temporal.PlainDate;
  yearGanZhi: string;
  monthGanZhi: string;
  gender: Gender;
  dayMaster: Stem;
  nowYear?: number;
}): LuckCycleResult | null {
  const direction = getLuckDirection(params.yearGanZhi, params.gender);
  if (!direction) return null;
  const boundaries = getJieBoundaries(params.birthDate.year);
  const target = direction.forward
    ? boundaries.find((item) => Temporal.Instant.compare(item.instant, params.birthInstant) > 0)
    : [...boundaries].reverse().find((item) => Temporal.Instant.compare(item.instant, params.birthInstant) <= 0);
  if (!target) throw new Error("无法找到起运所需的相邻节令");

  const diffMs = Math.abs(Number(target.instant.epochMilliseconds - params.birthInstant.epochMilliseconds));
  const traditionalYears = diffMs / 86_400_000 / 3;
  let years = Math.floor(traditionalYears);
  const monthFloat = (traditionalYears - years) * 12;
  let months = Math.floor(monthFloat);
  let days = Math.round((monthFloat - months) * 30);
  if (days === 30) { months += 1; days = 0; }
  if (months === 12) { years += 1; months = 0; }
  const startDate = params.birthDate.add({ years, months, days });
  const currentYear = params.nowYear ?? Temporal.Now.plainDateISO().year;
  const items = Array.from({ length: 12 }, (_, index) => {
    const startYear = startDate.year + index * 10;
    const pillar = createPillar("luck", `第${index + 1}步大运`, shiftGanZhi(params.monthGanZhi, direction.forward ? index + 1 : -(index + 1)), params.dayMaster);
    return {
      index,
      pillar,
      startYear,
      endYear: startYear + 9,
      startAge: years + index * 10,
      endAge: years + index * 10 + 9,
      isCurrent: currentYear >= startYear && currentYear <= startYear + 9,
    };
  });

  return {
    forward: direction.forward,
    directionReason: direction.reason,
    startAge: { years, months, days },
    startDate: startDate.toString(),
    rule: `按出生时刻至${direction.forward ? "下一" : "上一"}个“节”的实时间隔折算，三天一岁、一日四个月；该规则属于常见子平法，流派可有差异。`,
    items,
  };
}

export function findLuckPillar(result: LuckCycleResult | null, year: number): Pillar | undefined {
  return result?.items.find((item) => year >= item.startYear && year <= item.endYear)?.pillar;
}
