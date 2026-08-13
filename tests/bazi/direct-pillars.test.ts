import { describe, expect, it } from "vitest";
import { calculateBaziChart } from "@/lib/bazi/four-pillars";
import { hourPillarsForDayStem, monthPillarsForYearStem, validBranchesForStem } from "@/lib/bazi/pillars";
import type { BirthInput } from "@/lib/bazi/types";
import { birthInputSchema } from "@/lib/bazi/validation";

const direct: BirthInput = {
  name: "直排测试", gender: "male", calendarType: "pillars",
  directPillars: { year: "戊子", month: "丁巳", day: "壬子", hour: "癸卯" },
  year: 1990, month: 1, day: 1, isLeapMonth: false, timeKnown: true, hour: 12, minute: 0,
  locationId: "beijing", timeMode: "localStandard", dayBoundaryRule: "lateZiNextDay",
  showHiddenStems: true, showTenGods: true, showNaYin: true, showGrowth: true, showShenSha: true,
};

describe("四柱直排", () => {
  it("按阴阳配对、五虎遁和五鼠遁逐层约束候选", () => {
    expect(validBranchesForStem("甲")).toEqual(["子", "寅", "辰", "午", "申", "戌"]);
    expect(validBranchesForStem("乙")).toEqual(["丑", "卯", "巳", "未", "酉", "亥"]);
    expect(monthPillarsForYearStem("甲")).toEqual(["丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉", "甲戌", "乙亥", "丙子", "丁丑"]);
    expect(hourPillarsForDayStem("甲")).toEqual(["甲子", "乙丑", "丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉", "甲戌", "乙亥"]);
  });
  it("按六十甲子生成真实原局且不伪造起运", () => {
    const chart = calculateBaziChart("direct", direct);
    expect(chart.pillars.map((pillar) => pillar?.ganZhi)).toEqual(["戊子", "丁巳", "壬子", "癸卯"]);
    expect(chart.dayMaster).toBe("壬");
    expect(chart.luckCycle).toBeNull();
    expect(chart.shenSha.length).toBeGreaterThan(1);
    expect(chart.warnings[0]).toContain("无法唯一对应");
  });

  it("拒绝不符合五虎遁或五鼠遁的四柱组合", () => {
    expect(birthInputSchema.safeParse({ ...direct, directPillars: { ...direct.directPillars!, month: "丙寅" } }).success).toBe(false);
    expect(birthInputSchema.safeParse({ ...direct, directPillars: { ...direct.directPillars!, hour: "甲子" } }).success).toBe(false);
  });
});
