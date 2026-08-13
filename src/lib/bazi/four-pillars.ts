import { countFiveElements } from "./five-elements";
import { calculateLuckCycle } from "./luck-cycle";
import { createPillar, parseGanZhi } from "./pillars";
import type { BaziChart, BirthInput, Pillar } from "./types";
import { normalizeBirth } from "./calendar-adapter";
import { calculateShenSha, SHEN_SHA_STANDARD } from "./shen-sha";
import { getCity } from "./cities";
import { birthInputSchema } from "./validation";

const chartCache = new Map<string, BaziChart>();

export function calculateBaziChart(id: string, input: BirthInput): BaziChart {
  const cacheKey = JSON.stringify(input);
  const cached = chartCache.get(cacheKey);
  if (cached) return { ...cached, id };

  const parsedInput = birthInputSchema.parse(input) as BirthInput;
  if (parsedInput.calendarType === "pillars") {
    const direct = parsedInput.directPillars!;
    const dayMaster = parseGanZhi(direct.day).stem;
    const year = createPillar("natal", "年柱", direct.year, dayMaster);
    const month = createPillar("natal", "月柱", direct.month, dayMaster);
    const day = createPillar("natal", "日柱", direct.day, dayMaster);
    const time = createPillar("natal", "时柱", direct.hour, dayMaster);
    const location = getCity(parsedInput.locationId);
    const chart: BaziChart = {
      id,
      input: parsedInput,
      calendar: {
        inputCalendarText: `四柱 ${direct.year} ${direct.month} ${direct.day} ${direct.hour}`,
        solarText: "公历 未提供",
        lunarText: "农历 未提供",
        calculationText: "四柱直排（未反推出生日期）",
        timezone: location.timezone,
        utcOffset: "+08:00",
        location,
      },
      dayMaster,
      pillars: [year, month, day, time],
      fiveElements: countFiveElements([year, month, day, time]),
      taiYuan: "—",
      mingGong: "—",
      shenGong: "—",
      luckCycle: null,
      shenSha: parsedInput.showShenSha ? calculateShenSha([year, month, day, time]) : [],
      rules: [
        "四柱直排按用户给定的六十甲子生成原局。",
        "未从八字反推唯一出生日期，因此不生成起运日期和大运。",
        `神煞采用${SHEN_SHA_STANDARD.name}；只列规则命中，不据此断吉凶。`,
      ],
      warnings: ["四柱无法唯一对应一个出生时刻；如需精确大运、流年年龄与节气边界，请改用公历或农历排盘。"],
    };
    chartCache.set(cacheKey, chart);
    return chart;
  }

  const normalized = normalizeBirth(parsedInput);
  const dayMaster = parseGanZhi(normalized.dayGanZhi).stem;
  const year = createPillar("natal", "年柱", normalized.yearGanZhi, dayMaster);
  const month = createPillar(
    "natal",
    "月柱",
    normalized.monthGanZhi,
    dayMaster,
  );
  const day = createPillar("natal", "日柱", normalized.dayGanZhi, dayMaster);
  const time: Pillar | null = normalized.timeGanZhi
    ? createPillar("natal", "时柱", normalized.timeGanZhi, dayMaster)
    : null;
  const luckCycle = calculateLuckCycle({
    birthInstant: normalized.zonedDateTime.toInstant(),
    birthDate: normalized.localDateTime.toPlainDate(),
    yearGanZhi: normalized.yearGanZhi,
    monthGanZhi: normalized.monthGanZhi,
    timeGanZhi: normalized.timeGanZhi,
    gender: parsedInput.gender,
    dayMaster,
  });

  const chart: BaziChart = {
    id,
    input: parsedInput,
    calendar: normalized.context,
    dayMaster,
    pillars: [year, month, day, time],
    fiveElements: countFiveElements([year, month, day, time]),
    taiYuan: normalized.taiYuan,
    mingGong: normalized.mingGong,
    shenGong: normalized.shenGong,
    luckCycle,
    shenSha: parsedInput.showShenSha ? calculateShenSha([year, month, day, time]) : [],
    rules: [
      "年柱以立春精确交接时刻为界。",
      "月柱按十二个“节”的精确交接时刻划分。",
      parsedInput.dayBoundaryRule === "lateZiNextDay"
        ? "晚子初（23:00）起换日。"
        : "日柱在当地民用时 00:00 换日。",
      "节令时刻以寿星天文历算法数据为基础，并转换到出生地 IANA 时区。",
      "真太阳时首版未启用，不以粗略修正冒充精确结果。",
      `神煞采用${SHEN_SHA_STANDARD.name}；只列规则命中，不据此断吉凶。`,
    ],
    warnings: normalized.warnings,
  };
  chartCache.set(cacheKey, chart);
  return chart;
}

export function clearChartMemo(): void {
  chartCache.clear();
}
