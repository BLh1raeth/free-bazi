import { describe, expect, it } from "vitest";
import { createPillar } from "@/lib/bazi/pillars";
import type { BaziChart, FlowYear } from "@/lib/bazi/types";
import { flowYearAnnotations } from "@/lib/bazi/transit-annotations";

function chartWith(pillars: BaziChart["pillars"], luckStartYear = 2026): BaziChart {
  return {
    id: "test",
    input: {
      gender: "male", calendarType: "solar", year: 1990, month: 1, day: 1,
      isLeapMonth: false, timeKnown: true, hour: 12, minute: 0, locationId: "beijing",
      timeMode: "localStandard", dayBoundaryRule: "lateZiNextDay", showHiddenStems: true,
      showTenGods: true, showNaYin: true, showGrowth: true, showShenSha: true,
    },
    calendar: {} as BaziChart["calendar"], dayMaster: "甲", pillars,
    fiveElements: {} as BaziChart["fiveElements"], taiYuan: "", mingGong: "", shenGong: "",
    luckCycle: {
      forward: true, directionReason: "", startAge: { years: 1, months: 0, days: 0 },
      startDate: "1991-01-01", rule: "", items: [{
        index: 0, pillar: createPillar("luck", "大运", "丙午", "甲"), startYear: luckStartYear,
        endYear: luckStartYear + 9, startAge: 1, endAge: 10, startDate: `${luckStartYear}-01-01`, endDate: `${luckStartYear + 10}-01-01`, isCurrent: true,
      }],
      minorLuck: [],
    },
    shenSha: [], rules: [], warnings: [],
  };
}

function flow(year: number, ganZhi: string): FlowYear {
  return { year, pillar: createPillar("year", "流年", ganZhi, "甲"), nominalAge: 1, fullAge: 0, relations: [] };
}

describe("流年提示", () => {
  it("识别岁运并临、伏吟与换大运", () => {
    const natal = createPillar("natal", "年柱", "丙午", "甲");
    const chart = chartWith([natal, createPillar("natal", "月柱", "丁卯", "甲"), createPillar("natal", "日柱", "甲子", "甲"), null]);
    const luck = createPillar("luck", "大运", "丙午", "甲");
    expect(flowYearAnnotations(flow(2026, "丙午"), chart, luck)).toEqual(
      expect.arrayContaining(["岁运并临", "伏吟·年柱", "换大运"]),
    );
  });

  it("天干五行相克且地支六冲时才标天克地冲", () => {
    const natal = createPillar("natal", "年柱", "甲子", "甲");
    const chart = chartWith([natal, createPillar("natal", "月柱", "丁卯", "甲"), createPillar("natal", "日柱", "戊辰", "甲"), null], 2030);
    expect(flowYearAnnotations(flow(2026, "庚午"), chart, null)).toContain("天克地冲·年柱");
    expect(flowYearAnnotations(flow(2026, "壬午"), chart, null)).not.toContain("天克地冲·年柱");
  });
});
