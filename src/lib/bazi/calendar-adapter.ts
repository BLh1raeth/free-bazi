import { Temporal } from "@js-temporal/polyfill";
import { Lunar, Solar } from "lunar-typescript";
import { getCity } from "./cities";
import type { BirthInput, CalendarContext, DayBoundaryRule } from "./types";
import { trueSolarOffsetMinutes } from "./solar-time";
import { birthInputSchema } from "./validation";

export interface NormalizedBirth {
  input: BirthInput;
  context: CalendarContext;
  localDateTime: Temporal.PlainDateTime;
  zonedDateTime: Temporal.ZonedDateTime;
  solar: Solar;
  localLunar: Lunar;
  termLunar: Lunar;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  timeGanZhi: string | null;
  taiYuan: string;
  mingGong: string;
  shenGong: string;
  warnings: string[];
}

export interface SolarTermBoundary {
  name: string;
  shanghaiText: string;
  instant: Temporal.Instant;
}

const JIE_NAMES = ["小寒", "立春", "惊蛰", "清明", "立夏", "芒种", "小暑", "立秋", "白露", "寒露", "立冬", "大雪"] as const;
const TERM_ALIAS: Record<string, string> = {
  XIAO_HAN: "小寒", LI_CHUN: "立春", JING_ZHE: "惊蛰", QING_MING: "清明", LI_XIA: "立夏", MANG_ZHONG: "芒种",
  XIAO_SHU: "小暑", LI_QIU: "立秋", BAI_LU: "白露", HAN_LU: "寒露", LI_DONG: "立冬", DA_XUE: "大雪",
};

function solarToShanghaiZdt(solar: Solar): Temporal.ZonedDateTime {
  return Temporal.ZonedDateTime.from({
    timeZone: "Asia/Shanghai",
    year: solar.getYear(), month: solar.getMonth(), day: solar.getDay(),
    hour: solar.getHour(), minute: solar.getMinute(), second: solar.getSecond(),
  });
}

function solarToText(solar: Solar): string {
  return solar.toYmdHms();
}

export function getJieBoundaries(centerYear: number): SolarTermBoundary[] {
  const seen = new Set<string>();
  const results: SolarTermBoundary[] = [];
  for (let year = centerYear - 1; year <= centerYear + 1; year += 1) {
    const table = Solar.fromYmdHms(year, 7, 1, 12, 0, 0).getLunar().getJieQiTable();
    for (const [rawName, solar] of Object.entries(table)) {
      const name = TERM_ALIAS[rawName] ?? rawName;
      if (!JIE_NAMES.includes(name as (typeof JIE_NAMES)[number])) continue;
      const key = solarToText(solar);
      if (seen.has(key)) continue;
      seen.add(key);
      const zdt = solarToShanghaiZdt(solar);
      results.push({ name, shanghaiText: key, instant: zdt.toInstant() });
    }
  }
  return results.sort((a, b) => Temporal.Instant.compare(a.instant, b.instant));
}

export function termInTimezone(term: SolarTermBoundary, timezone: string): string {
  return term.instant.toZonedDateTimeISO(timezone).toPlainDateTime().toString({ smallestUnit: "minute" }).replace("T", " ");
}

function lunarText(lunar: Lunar): string {
  const leap = lunar.getMonth() < 0 ? "闰" : "";
  return `农历${lunar.getYearInChinese()}年${leap}${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
}

export function dayGanZhiFor(lunar: Lunar, rule: DayBoundaryRule): string {
  return rule === "lateZiNextDay" ? lunar.getDayInGanZhiExact() : lunar.getDayInGanZhiExact2();
}

export function normalizeBirth(rawInput: BirthInput): NormalizedBirth {
  const input = birthInputSchema.parse(rawInput) as BirthInput;
  if (input.calendarType === "pillars") {
    throw new Error("四柱直排由独立入口计算，不能套用出生日期换算");
  }
  const location = getCity(input.locationId);
  const calculationHour = input.timeKnown ? input.hour : 12;
  const calculationMinute = input.timeKnown ? input.minute : 0;

  let solar: Solar;
  try {
    solar = input.calendarType === "solar"
      ? Solar.fromYmdHms(input.year, input.month, input.day, calculationHour, calculationMinute, 0)
      : Lunar.fromYmdHms(input.year, input.isLeapMonth ? -input.month : input.month, input.day, calculationHour, calculationMinute, 0).getSolar();
  } catch {
    throw new Error(input.calendarType === "lunar" ? "该农历日期不存在，请检查日期或闰月选项" : "该公历日期不存在");
  }

  let localDateTime = Temporal.PlainDateTime.from({
    year: solar.getYear(), month: solar.getMonth(), day: solar.getDay(),
    hour: calculationHour, minute: calculationMinute,
  });
  let adjustmentNote = "";
  if (input.timeMode === "trueSolar") {
    const adjustmentMinutes = Math.round(trueSolarOffsetMinutes(
      { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() },
      location.longitude,
      location.timezone,
    ));
    if (adjustmentMinutes !== 0) {
      localDateTime = localDateTime.add({ minutes: adjustmentMinutes });
      solar = Solar.fromYmdHms(localDateTime.year, localDateTime.month, localDateTime.day, localDateTime.hour, localDateTime.minute, 0);
      adjustmentNote = `真太阳时修正 ${adjustmentMinutes > 0 ? "+" : ""}${adjustmentMinutes} 分钟（${location.city}，按经度与当日均时差）`;
    }
  }
  const zonedDateTime = Temporal.ZonedDateTime.from({
    timeZone: location.timezone,
    year: localDateTime.year, month: localDateTime.month, day: localDateTime.day,
    hour: localDateTime.hour, minute: localDateTime.minute,
  }, { disambiguation: "compatible" });
  if (zonedDateTime.year !== localDateTime.year || zonedDateTime.month !== localDateTime.month || zonedDateTime.day !== localDateTime.day || zonedDateTime.hour !== localDateTime.hour || zonedDateTime.minute !== localDateTime.minute) {
    throw new Error("该当地时间因夏令时跳时而不存在，请选择跳时后的有效时刻");
  }

  // 节令在全球同一瞬间交接：先把出生瞬间换算为东八区，再交给以 GMT+8 为基准的历法库。
  const shanghai = zonedDateTime.withTimeZone("Asia/Shanghai");
  const termLunar = Solar.fromYmdHms(shanghai.year, shanghai.month, shanghai.day, shanghai.hour, shanghai.minute, shanghai.second).getLunar();
  const localLunar = solar.getLunar();
  const eightChar = localLunar.getEightChar();
  eightChar.setSect(input.dayBoundaryRule === "lateZiNextDay" ? 1 : 2);

  const warnings: string[] = [];
  if (!input.timeKnown) warnings.push("出生时刻未知：未生成确定时柱；年柱、月柱以当日 12:00 估算，若当天恰逢节令交接需补充时刻复核。");
  if (location.timezone !== "Asia/Shanghai") warnings.push("节令边界已按出生地 IANA 时区换算；胎元、命宫、身宫沿用历法库常用公式，流派差异请见规则说明。");

  const inputCalendarText = input.calendarType === "solar"
    ? `公历 ${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")}`
    : `农历 ${input.year}年${input.isLeapMonth ? "闰" : ""}${input.month}月${input.day}日`;
  const calculationText = input.timeMode === "trueSolar" && adjustmentNote
    ? `${localDateTime.toString({ smallestUnit: "minute" }).replace("T", " ")}（${adjustmentNote}）`
    : `${localDateTime.toString({ smallestUnit: "minute" }).replace("T", " ")}（${location.city}当地民用时）`;

  return {
    input,
    context: {
      inputCalendarText,
      solarText: `公历 ${solar.toYmd()}${input.timeKnown ? ` ${String(input.hour).padStart(2, "0")}:${String(input.minute).padStart(2, "0")}` : " 时刻未知"}`,
      lunarText: lunarText(localLunar),
      calculationText,
      timezone: location.timezone,
      utcOffset: zonedDateTime.offset,
      location,
      instantIso: input.timeKnown ? zonedDateTime.toInstant().toString() : undefined,
    },
    localDateTime,
    zonedDateTime,
    solar,
    localLunar,
    termLunar,
    yearGanZhi: termLunar.getYearInGanZhiExact(),
    monthGanZhi: termLunar.getMonthInGanZhiExact(),
    dayGanZhi: dayGanZhiFor(localLunar, input.dayBoundaryRule),
    timeGanZhi: input.timeKnown ? eightChar.getTime() : null,
    taiYuan: eightChar.getTaiYuan(),
    mingGong: eightChar.getMingGong(),
    shenGong: eightChar.getShenGong(),
    warnings,
  };
}
