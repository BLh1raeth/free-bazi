import { Temporal } from "@js-temporal/polyfill";
import { Solar } from "lunar-typescript";
import { dayGanZhiFor, getJieBoundaries, termInTimezone } from "./calendar-adapter";
import { findLuckPillar } from "./luck-cycle";
import { createPillar } from "./pillars";
import { analyzeRelations } from "./relations";
import type {
  DayBoundaryRule,
  FlowDay,
  FlowHour,
  FlowMonth,
  FlowYear,
  LuckCycleItem,
  LuckCycleResult,
  Pillar,
  Stem,
} from "./types";

export function generateMinorLuckFlowYears(params: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  dayMaster: Stem;
  natalPillars: Pillar[];
  luckCycle: LuckCycleResult;
}): FlowYear[] {
  if (params.luckCycle.minorLuck.length === 0) return [];
  const first = params.luckCycle.minorLuck[0]!.year;
  const last = params.luckCycle.minorLuck.at(-1)!.year;
  return generateFlowYears({
    startYear: first,
    endYear: last,
    birthYear: params.birthYear,
    birthMonth: params.birthMonth,
    birthDay: params.birthDay,
    dayMaster: params.dayMaster,
    natalPillars: params.natalPillars,
    luckCycle: params.luckCycle,
  });
}

function pillarFromShanghaiInstant(instant: Temporal.Instant, level: Pillar["level"], label: string, dayMaster: Stem): Pillar {
  const shanghai = instant.toZonedDateTimeISO("Asia/Shanghai");
  const lunar = Solar.fromYmdHms(shanghai.year, shanghai.month, shanghai.day, shanghai.hour, shanghai.minute, shanghai.second).getLunar();
  const ganZhi = level === "year" ? lunar.getYearInGanZhiExact() : lunar.getMonthInGanZhiExact();
  return createPillar(level, label, ganZhi, dayMaster);
}

function luckIndexAtYearMidpoint(result: LuckCycleResult | null, year: number): number | undefined {
  if (!result) return undefined;
  const midpoint = Temporal.PlainDate.from({ year, month: 7, day: 1 });
  return result.items.find((item) => {
    const start = Temporal.PlainDate.from(item.startDate);
    const end = Temporal.PlainDate.from(item.endDate);
    return Temporal.PlainDate.compare(midpoint, start) >= 0 && Temporal.PlainDate.compare(midpoint, end) < 0;
  })?.index;
}

export function generateFlowYears(params: {
  startYear: number; endYear: number; birthYear: number; birthMonth: number; birthDay: number;
  dayMaster: Stem; natalPillars: Pillar[]; luckCycle: LuckCycleResult | null;
}): FlowYear[] {
  return Array.from({ length: params.endYear - params.startYear + 1 }, (_, offset) => {
    const year = params.startYear + offset;
    const lunar = Solar.fromYmdHms(year, 7, 1, 12, 0, 0).getLunar();
    const pillar = createPillar("year", `${year}流年`, lunar.getYearInGanZhiExact(), params.dayMaster);
    const luck = findLuckPillar(params.luckCycle, year);
    const beforeBirthday = Temporal.PlainDate.compare(Temporal.PlainDate.from({ year, month: Math.min(params.birthMonth, 12), day: Math.min(params.birthDay, 28) }), Temporal.PlainDate.from({ year, month: 7, day: 1 })) > 0;
    const fullAge = Math.max(0, year - params.birthYear - (beforeBirthday ? 1 : 0));
    return {
      year,
      pillar,
      nominalAge: Math.max(1, year - params.birthYear + 1),
      fullAge,
      luckIndex: luckIndexAtYearMidpoint(params.luckCycle, year),
      relations: analyzeRelations(pillar, [...params.natalPillars, ...(luck ? [luck] : [])]),
    };
  });
}

export function generateFlowYearsForLuck(params: {
  fallbackYear: number;
  selectedLuck: LuckCycleItem | null;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  dayMaster: Stem;
  natalPillars: Pillar[];
  luckCycle: LuckCycleResult | null;
}): FlowYear[] {
  return generateFlowYears({
    startYear: params.selectedLuck?.startYear ?? params.fallbackYear - 7,
    // 交运通常发生在年中；首尾两个交接年都需保留，因此一柱大运展示十一
    // 个公历年，具体归属再由精确交运日期判断，而不是粗暴截成十个年份。
    endYear: params.selectedLuck ? params.selectedLuck.startYear + 10 : params.fallbackYear + 7,
    birthYear: params.birthYear,
    birthMonth: params.birthMonth,
    birthDay: params.birthDay,
    dayMaster: params.dayMaster,
    natalPillars: params.natalPillars,
    luckCycle: params.luckCycle,
  });
}

const FLOW_MONTH_NAMES = ["寅月", "卯月", "辰月", "巳月", "午月", "未月", "申月", "酉月", "戌月", "亥月", "子月", "丑月"];

export function generateFlowMonths(params: { year: number; timezone: string; dayMaster: Stem; contexts: Pillar[]; luckCycle?: LuckCycleResult | null }): FlowMonth[] {
  const boundaries = getJieBoundaries(params.year);
  const startIndex = boundaries.findIndex((item) => item.name === "立春" && item.instant.toZonedDateTimeISO("Asia/Shanghai").year === params.year);
  if (startIndex < 0) throw new Error("未找到所选流年的立春节令");
  const selected = boundaries.slice(startIndex, startIndex + 13);
  if (selected.length < 13) throw new Error("节令数据不完整");
  return Array.from({ length: 12 }, (_, index) => {
    const start = selected[index];
    const end = selected[index + 1];
    if (!start || !end) throw new Error("节令边界缺失");
    const midpoint = Temporal.Instant.fromEpochMilliseconds(Math.round((Number(start.instant.epochMilliseconds) + Number(end.instant.epochMilliseconds)) / 2));
    const pillar = pillarFromShanghaiInstant(midpoint, "month", `${params.year}${FLOW_MONTH_NAMES[index]}`, params.dayMaster);
    const luckHandoffs = (params.luckCycle?.items ?? [])
      .filter((item) => {
        const handoff = Temporal.PlainDate.from(item.startDate);
        const startDate = start.instant.toZonedDateTimeISO(params.timezone).toPlainDate();
        const endDate = end.instant.toZonedDateTimeISO(params.timezone).toPlainDate();
        return Temporal.PlainDate.compare(handoff, startDate) >= 0 && Temporal.PlainDate.compare(handoff, endDate) < 0;
      })
      .map((item) => `${item.startDate.slice(5)} 交${item.pillar.ganZhi}大运`);
    return {
      id: `${params.year}-${String(index + 1).padStart(2, "0")}`,
      name: FLOW_MONTH_NAMES[index] ?? `${index + 1}月`,
      pillar,
      startTerm: start.name,
      endTerm: end.name,
      startLocal: termInTimezone(start, params.timezone),
      endLocal: termInTimezone(end, params.timezone),
      startInstant: start.instant.toString(),
      endInstant: end.instant.toString(),
      luckHandoffs,
      relations: analyzeRelations(pillar, params.contexts),
    };
  });
}

export function generateFlowDays(params: { month: FlowMonth; timezone: string; dayMaster: Stem; dayBoundaryRule: DayBoundaryRule; contexts: Pillar[] }): FlowDay[] {
  const startInstant = Temporal.Instant.from(params.month.startInstant);
  const endInstant = Temporal.Instant.from(params.month.endInstant);
  let date = startInstant.toZonedDateTimeISO(params.timezone).toPlainDate().subtract({ days: 1 });
  const lastDate = endInstant.toZonedDateTimeISO(params.timezone).toPlainDate().add({ days: 1 });
  const days: FlowDay[] = [];
  while (Temporal.PlainDate.compare(date, lastDate) <= 0) {
    const noon = Temporal.ZonedDateTime.from({ timeZone: params.timezone, year: date.year, month: date.month, day: date.day, hour: 12 });
    if (Temporal.Instant.compare(noon.toInstant(), startInstant) >= 0 && Temporal.Instant.compare(noon.toInstant(), endInstant) < 0) {
      days.push(generateFlowDay({ date: date.toString(), dayMaster: params.dayMaster, dayBoundaryRule: params.dayBoundaryRule, contexts: params.contexts }));
    }
    date = date.add({ days: 1 });
  }
  return days;
}

export function generateFlowDay(params: { date: string; dayMaster: Stem; dayBoundaryRule: DayBoundaryRule; contexts: Pillar[] }): FlowDay {
  const date = Temporal.PlainDate.from(params.date);
  const solar = Solar.fromYmdHms(date.year, date.month, date.day, 12, 0, 0);
  const lunar = solar.getLunar();
  const pillar = createPillar("day", `${date.toString()}流日`, dayGanZhiFor(lunar, params.dayBoundaryRule), params.dayMaster);
  return {
    date: date.toString(),
    lunarText: `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    weekText: `星期${solar.getWeekInChinese()}`,
    pillar,
    relations: analyzeRelations(pillar, params.contexts),
  };
}

const HOUR_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const HOUR_RANGES = ["23:00–00:59（跨日）", "01:00–02:59", "03:00–04:59", "05:00–06:59", "07:00–08:59", "09:00–10:59", "11:00–12:59", "13:00–14:59", "15:00–16:59", "17:00–18:59", "19:00–20:59", "21:00–22:59"];

export function generateFlowHours(params: { date: string; dayMaster: Stem; dayBoundaryRule: DayBoundaryRule; contexts: Pillar[] }): FlowHour[] {
  const date = Temporal.PlainDate.from(params.date);
  return HOUR_BRANCHES.map((branch, index) => {
    const hour = index === 0 ? 0 : index * 2;
    const lunar = Solar.fromYmdHms(date.year, date.month, date.day, hour, 0, 0).getLunar();
    const ec = lunar.getEightChar();
    ec.setSect(params.dayBoundaryRule === "lateZiNextDay" ? 1 : 2);
    const pillar = createPillar("hour", `${branch}时`, ec.getTime(), params.dayMaster);
    return { index, name: `${branch}时`, timeRange: HOUR_RANGES[index] ?? "", pillar, relations: analyzeRelations(pillar, params.contexts) };
  });
}
