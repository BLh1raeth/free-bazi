import { Temporal } from "@js-temporal/polyfill";

/**
 真太阳时修正：
   真太阳时 = 当地标准钟面时 + (出生地经度 − 时区标准经线)×4 分钟 + 当日均时差
 中国标准时区为 UTC+8，标准经线 120°E；乌鲁木齐（87.6°E）约晚 2 小时 10 分。
 均时差采用天文历常见近似公式（精度约 ±1 分钟，足以用于时辰与日界判断）。
 */

function dayOfYear(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86_400_000) + 1;
}

/** 均时差（分钟），正值表示真太阳时快于平均太阳时。 */
export function equationOfTimeMinutes(year: number, month: number, day: number): number {
  const n = dayOfYear(year, month, day);
  const b = (2 * Math.PI * (n - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/** 取该时区在指定日期的标准经线（按当时实际 UTC 偏移换算）。 */
export function standardMeridianFor(timezone: string, year: number, month: number, day: number): number {
  const zoned = Temporal.ZonedDateTime.from({
    timeZone: timezone,
    year,
    month,
    day,
    hour: 12,
  });
  const sign = zoned.offset.startsWith("-") ? -1 : 1;
  const [hours, minutes] = zoned.offset.slice(1).split(":").map(Number);
  const totalMinutes = sign * ((hours ?? 0) * 60 + (minutes ?? 0));
  // 每 4 分钟对应 1° 经度
  return totalMinutes / 4;
}

/**
 真太阳时相对当地钟面时的总修正量（分钟）。
 正值表示真太阳时快于钟面时，负值表示慢于钟面时。
 */
export function trueSolarOffsetMinutes(
  date: { year: number; month: number; day: number },
  longitude: number,
  timezone: string,
): number {
  const standardMeridian = standardMeridianFor(timezone, date.year, date.month, date.day);
  return (longitude - standardMeridian) * 4 + equationOfTimeMinutes(date.year, date.month, date.day);
}
