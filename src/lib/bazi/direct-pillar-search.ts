import { Temporal } from "@js-temporal/polyfill";
import { Solar } from "lunar-typescript";
import { dayGanZhiFor, getJieBoundaries } from "./calendar-adapter";
import { getCity } from "./cities";
import { hourPillarsForDayStem, monthPillarsForYearStem, parseGanZhi } from "./pillars";
import { BRANCHES, type DayBoundaryRule, type DirectPillarsInput } from "./types";

export interface DirectPillarBirthTime {
  key: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  hourRange: string;
  displayText: string;
}

const MONTH_START_JIE = [
  "立春", "惊蛰", "清明", "立夏", "芒种", "小暑", "立秋", "白露", "寒露", "立冬", "大雪",
] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 四柱直排反推：在 1900–2100 内找出所有“会产生完全相同的年、月、日、时四柱”
 的出生时刻候选。每个候选给出一个代表时刻（取时辰窗口内确定同柱的时刻），
 供使用者确认后按公历排盘，从而正常计算大运。
 */
export function findDirectPillarBirthTimes(
  pillars: DirectPillarsInput,
  locationId: string,
  dayBoundaryRule: DayBoundaryRule = "lateZiNextDay",
): DirectPillarBirthTime[] {
  const timezone = getCity(locationId).timezone;
  const results: DirectPillarBirthTime[] = [];

  for (let year = 1900; year <= 2100; year += 1) {
    // 年中取日柱可稳定得到该“立春年”的年柱
    const midYearGanZhi = Solar.fromYmdHms(year, 6, 1, 12, 0, 0).getLunar().getYearInGanZhiExact();
    if (midYearGanZhi !== pillars.year) continue;

    const yearStem = parseGanZhi(pillars.year).stem;
    const monthIndex = monthPillarsForYearStem(yearStem).indexOf(pillars.month);
    if (monthIndex < 0) continue;

    const boundaries = getJieBoundaries(year);
    const startJie = monthIndex === 11
      ? boundaries.find(
        (jie) => jie.name === "小寒" && jie.instant.toZonedDateTimeISO("Asia/Shanghai").year === year + 1,
      )
      : boundaries.find(
        (jie) => jie.name === MONTH_START_JIE[monthIndex] && jie.instant.toZonedDateTimeISO("Asia/Shanghai").year === year,
      );
    if (!startJie) continue;
    const endJie = boundaries.find((jie) => Temporal.Instant.compare(jie.instant, startJie.instant) > 0);
    if (!endJie) continue;

    let cursor = startJie.instant.toZonedDateTimeISO(timezone).toPlainDate();
    const endDate = endJie.instant.toZonedDateTimeISO(timezone).toPlainDate();
    while (Temporal.PlainDate.compare(cursor, endDate) <= 0) {
      const lunarNoon = Solar.fromYmdHms(cursor.year, cursor.month, cursor.day, 12, 0, 0).getLunar();
      if (dayGanZhiFor(lunarNoon, dayBoundaryRule) !== pillars.day) {
        cursor = cursor.add({ days: 1 });
        continue;
      }

      const dayStem = parseGanZhi(pillars.day).stem;
      const hourIndex = hourPillarsForDayStem(dayStem).indexOf(pillars.hour);
      if (hourIndex < 0) {
        cursor = cursor.add({ days: 1 });
        continue;
      }

      if (hourIndex === 0) {
        // 子时跨 00:00–00:59 与 23:00–23:59；代表时刻取 00:30，两种换日规则下日柱、时柱均确定。
        results.push({
          key: `${cursor.toString()}-zi`,
          year: cursor.year,
          month: cursor.month,
          day: cursor.day,
          hour: 0,
          minute: 30,
          hourRange: "00:00–00:59（子时）",
          displayText: `${cursor.toString()} 00:30 子时`,
        });
      } else {
        const startHour = hourIndex * 2 - 1;
        results.push({
          key: `${cursor.toString()}-h${hourIndex}`,
          year: cursor.year,
          month: cursor.month,
          day: cursor.day,
          hour: startHour,
          minute: 30,
          hourRange: `${pad(startHour)}:00–${pad(startHour + 2)}:59（${BRANCHES[hourIndex]}时）`,
          displayText: `${cursor.toString()} ${pad(startHour)}:30 ${BRANCHES[hourIndex]}时`,
        });
      }
      cursor = cursor.add({ days: 1 });
    }
  }
  return results;
}
