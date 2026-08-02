import { describe, expect, it } from "vitest";
import { Lunar, Solar } from "lunar-typescript";
import { normalizeBirth } from "@/lib/bazi/calendar-adapter";
import type { BirthInput } from "@/lib/bazi/types";
import { birthInputSchema } from "@/lib/bazi/validation";
import { CALENDAR_CASES } from "../fixtures/calendar-cases";

function birth(overrides: Partial<BirthInput> = {}): BirthInput {
  return {
    name: "测试", gender: "male", calendarType: "solar", year: 2024, month: 2, day: 4, isLeapMonth: false,
    timeKnown: true, hour: 12, minute: 0, locationId: "beijing", timeMode: "localStandard", dayBoundaryRule: "lateZiNextDay",
    showHiddenStems: true, showTenGods: true, showNaYin: true, showGrowth: true, showShenSha: false,
    ...overrides,
  };
}

describe("公农历与节令边界", () => {
  it("与香港天文台公农历对照案例一致", () => {
    for (const item of CALENDAR_CASES) {
      const lunar = Solar.fromYmd(item.solar.year, item.solar.month, item.solar.day).getLunar();
      expect([lunar.getYear(), Math.abs(lunar.getMonth()), lunar.getDay(), lunar.getMonth() < 0], item.source).toEqual([item.lunar.year, item.lunar.month, item.lunar.day, item.lunar.leap]);
    }
  });

  it("支持农历闰月反查", () => {
    expect(Lunar.fromYmd(2023, -2, 1).getSolar().toYmd()).toBe("2023-03-22");
    expect(normalizeBirth(birth({ calendarType: "lunar", year: 2023, month: 2, day: 1, isLeapMonth: true })).solar.toYmd()).toBe("2023-03-22");
  });

  it("立春前后一分钟切换年柱与月柱", () => {
    const before = normalizeBirth(birth({ hour: 16, minute: 26 }));
    const after = normalizeBirth(birth({ hour: 16, minute: 28 }));
    expect([before.yearGanZhi, before.monthGanZhi]).toEqual(["癸卯", "乙丑"]);
    expect([after.yearGanZhi, after.monthGanZhi]).toEqual(["甲辰", "丙寅"]);
  });

  it("惊蛰前后一分钟切换节令流月", () => {
    const before = normalizeBirth(birth({ month: 3, day: 5, hour: 10, minute: 21 }));
    const after = normalizeBirth(birth({ month: 3, day: 5, hour: 10, minute: 23 }));
    expect(before.monthGanZhi).toBe("丙寅");
    expect(after.monthGanZhi).toBe("丁卯");
  });

  it("23:00 换日规则可以切换", () => {
    const lateZi = normalizeBirth(birth({ month: 1, day: 1, hour: 23, minute: 0, dayBoundaryRule: "lateZiNextDay" }));
    const midnight = normalizeBirth(birth({ month: 1, day: 1, hour: 23, minute: 0, dayBoundaryRule: "midnight" }));
    const lateZiLastMinute = normalizeBirth(birth({ month: 1, day: 1, hour: 23, minute: 59, dayBoundaryRule: "lateZiNextDay" }));
    const nextMidnight = normalizeBirth(birth({ month: 1, day: 2, hour: 0, minute: 0, dayBoundaryRule: "midnight" }));
    expect(lateZi.dayGanZhi).toBe("乙丑");
    expect(midnight.dayGanZhi).toBe("甲子");
    expect(lateZiLastMinute.dayGanZhi).toBe("乙丑");
    expect(nextMidnight.dayGanZhi).toBe("乙丑");
  });

  it("未知出生时刻不生成时柱", () => {
    expect(normalizeBirth(birth({ timeKnown: false })).timeGanZhi).toBeNull();
  });

  it("同一瞬间在不同时区具有相同节令年、月柱", () => {
    const beijing = normalizeBirth(birth({ locationId: "beijing", hour: 16, minute: 28 }));
    const tokyo = normalizeBirth(birth({ locationId: "tokyo", hour: 17, minute: 28 }));
    expect(beijing.zonedDateTime.toInstant().toString()).toBe(tokyo.zonedDateTime.toInstant().toString());
    expect([beijing.yearGanZhi, beijing.monthGanZhi]).toEqual([tokyo.yearGanZhi, tokyo.monthGanZhi]);
  });

  it("夏令时有效日期取得正确偏移，跳时空档明确拒绝", () => {
    const summer = normalizeBirth(birth({ locationId: "new-york", month: 7, day: 1, hour: 12 }));
    expect(summer.context.utcOffset).toBe("-04:00");
    expect(() => normalizeBirth(birth({ locationId: "new-york", month: 3, day: 10, hour: 2, minute: 30 }))).toThrow("夏令时跳时");
  });

  it("拒绝非法日期与超范围年份", () => {
    expect(birthInputSchema.safeParse(birth({ month: 2, day: 30 })).success).toBe(false);
    expect(birthInputSchema.safeParse(birth({ year: 1899 })).success).toBe(false);
  });
});
