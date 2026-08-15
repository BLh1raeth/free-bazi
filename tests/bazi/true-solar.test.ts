import { describe, expect, it } from "vitest";
import { normalizeBirth } from "../../src/lib/bazi/calendar-adapter";
import { trueSolarOffsetMinutes } from "../../src/lib/bazi/solar-time";
import type { BirthInput } from "../../src/lib/bazi/types";

function baseInput(overrides: Partial<BirthInput> = {}): BirthInput {
  return {
    gender: "male",
    calendarType: "solar",
    year: 1990,
    month: 1,
    day: 1,
    isLeapMonth: false,
    timeKnown: true,
    hour: 6,
    minute: 30,
    locationId: "beijing",
    timeMode: "trueSolar",
    dayBoundaryRule: "lateZiNextDay",
    showHiddenStems: true,
    showTenGods: true,
    showNaYin: true,
    showGrowth: true,
    showShenSha: true,
    ...overrides,
  };
}

describe("真太阳时", () => {
  it("乌鲁木齐相对北京有约两小时的负修正（经度差加均时差）", () => {
    const offset = trueSolarOffsetMinutes({ year: 1990, month: 1, day: 1 }, 87.6168, "Asia/Shanghai");
    expect(offset).toBeGreaterThan(-140);
    expect(offset).toBeLessThan(-125);
  });

  it("同一钟面时间在乌鲁木齐与北京得到不同的时柱", () => {
    const beijing = normalizeBirth(baseInput({ locationId: "beijing" }));
    const urumqi = normalizeBirth(baseInput({ locationId: "urumqi" }));
    expect(beijing.timeGanZhi).not.toBe(urumqi.timeGanZhi);
    expect(beijing.context.calculationText).toContain("真太阳时修正");
    expect(urumqi.context.calculationText).toContain("真太阳时修正");
  });

  it("午夜附近经修正后跨日时，日柱随换日规则变化", () => {
    const standard = normalizeBirth(baseInput({
      year: 1990,
      month: 6,
      day: 15,
      hour: 0,
      minute: 10,
      locationId: "beijing",
      timeMode: "localStandard",
      dayBoundaryRule: "midnight",
    }));
    const trueSolar = normalizeBirth(baseInput({
      year: 1990,
      month: 6,
      day: 15,
      hour: 0,
      minute: 10,
      locationId: "beijing",
      timeMode: "trueSolar",
      dayBoundaryRule: "midnight",
    }));
    expect(standard.dayGanZhi).not.toBe(trueSolar.dayGanZhi);
  });
});
