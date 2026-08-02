import { countFiveElements } from "./five-elements";
import { calculateLuckCycle } from "./luck-cycle";
import { createPillar, parseGanZhi } from "./pillars";
import type { BaziChart, BirthInput, Pillar } from "./types";
import { normalizeBirth } from "./calendar-adapter";

const chartCache = new Map<string, BaziChart>();

export function calculateBaziChart(id: string, input: BirthInput): BaziChart {
  const cacheKey = JSON.stringify(input);
  const cached = chartCache.get(cacheKey);
  if (cached) return { ...cached, id };

  const normalized = normalizeBirth(input);
  const dayMaster = parseGanZhi(normalized.dayGanZhi).stem;
  const year = createPillar("natal", "年柱", normalized.yearGanZhi, dayMaster);
  const month = createPillar("natal", "月柱", normalized.monthGanZhi, dayMaster);
  const day = createPillar("natal", "日柱", normalized.dayGanZhi, dayMaster);
  const time: Pillar | null = normalized.timeGanZhi ? createPillar("natal", "时柱", normalized.timeGanZhi, dayMaster) : null;
  const luckCycle = calculateLuckCycle({
    birthInstant: normalized.zonedDateTime.toInstant(),
    birthDate: normalized.localDateTime.toPlainDate(),
    yearGanZhi: normalized.yearGanZhi,
    monthGanZhi: normalized.monthGanZhi,
    gender: input.gender,
    dayMaster,
  });

  const chart: BaziChart = {
    id,
    input,
    calendar: normalized.context,
    dayMaster,
    pillars: [year, month, day, time],
    fiveElements: countFiveElements([year, month, day, time]),
    taiYuan: normalized.taiYuan,
    mingGong: normalized.mingGong,
    shenGong: normalized.shenGong,
    luckCycle,
    rules: [
      "年柱以立春精确交接时刻为界。",
      "月柱按十二个“节”的精确交接时刻划分。",
      input.dayBoundaryRule === "lateZiNextDay" ? "晚子初（23:00）起换日。" : "日柱在当地民用时 00:00 换日。",
      "节令时刻以寿星天文历算法数据为基础，并转换到出生地 IANA 时区。",
      "真太阳时首版未启用，不以粗略修正冒充精确结果。",
    ],
    warnings: normalized.warnings,
  };
  chartCache.set(cacheKey, chart);
  return chart;
}

export function clearChartMemo(): void {
  chartCache.clear();
}
