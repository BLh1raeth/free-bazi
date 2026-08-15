import { describe, expect, it } from "vitest";
import { findDirectPillarBirthTimes } from "../../src/lib/bazi/direct-pillar-search";
import { calculateBaziChart } from "../../src/lib/bazi/four-pillars";
import type { BirthInput } from "../../src/lib/bazi/types";

function baseInput(overrides: Partial<BirthInput> = {}): BirthInput {
  return {
    gender: "male",
    calendarType: "solar",
    year: 1990,
    month: 6,
    day: 15,
    isLeapMonth: false,
    timeKnown: true,
    hour: 12,
    minute: 0,
    locationId: "beijing",
    timeMode: "localStandard",
    dayBoundaryRule: "lateZiNextDay",
    showHiddenStems: true,
    showTenGods: true,
    showNaYin: true,
    showGrowth: true,
    showShenSha: true,
    ...overrides,
  };
}

describe("四柱直排反推出生时间", () => {
  it("已知命盘能反推出包含原出生日的候选", () => {
    const chart = calculateBaziChart("known", baseInput());
    const pillars = {
      year: chart.pillars[0]!.ganZhi,
      month: chart.pillars[1]!.ganZhi,
      day: chart.pillars[2]!.ganZhi,
      hour: chart.pillars[3]!.ganZhi,
    };
    const found = findDirectPillarBirthTimes(pillars, "beijing", "lateZiNextDay");
    expect(found.length).toBeGreaterThan(0);
    const noonCandidate = found.find((item) => item.year === 1990 && item.month === 6 && item.day === 15);
    expect(noonCandidate).toBeDefined();
    expect(noonCandidate!.hour).toBe(11); // 午时代表 11:30
    expect(noonCandidate!.hourRange).toContain("午时");
  });

  it("候选时刻回环计算出的四柱与原四柱一致", () => {
    const chart = calculateBaziChart("known2", baseInput());
    const pillars = {
      year: chart.pillars[0]!.ganZhi,
      month: chart.pillars[1]!.ganZhi,
      day: chart.pillars[2]!.ganZhi,
      hour: chart.pillars[3]!.ganZhi,
    };
    const found = findDirectPillarBirthTimes(pillars, "beijing", "lateZiNextDay");
    expect(found.length).toBeGreaterThan(0);
    const candidate = found[0]!;
    const roundtrip = calculateBaziChart("roundtrip", baseInput({
      year: candidate.year,
      month: candidate.month,
      day: candidate.day,
      hour: candidate.hour,
      minute: candidate.minute,
    }));
    expect(roundtrip.pillars.map((pillar) => pillar?.ganZhi)).toEqual([
      pillars.year,
      pillars.month,
      pillars.day,
      pillars.hour,
    ]);
    expect(roundtrip.luckCycle).not.toBeNull();
  });
});
