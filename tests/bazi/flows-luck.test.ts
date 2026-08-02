import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { calculateBaziChart } from "@/lib/bazi/four-pillars";
import { generateFlowDays, generateFlowHours, generateFlowMonths, generateFlowYears } from "@/lib/bazi/flows";
import { getLuckDirection } from "@/lib/bazi/luck-cycle";
import type { BirthInput, Pillar } from "@/lib/bazi/types";

const INPUT: BirthInput = {
  name: "案例", gender: "male", calendarType: "solar", year: 1990, month: 6, day: 15, isLeapMonth: false,
  timeKnown: true, hour: 12, minute: 0, locationId: "beijing", timeMode: "localStandard", dayBoundaryRule: "lateZiNextDay",
  showHiddenStems: true, showTenGods: true, showNaYin: true, showGrowth: true, showShenSha: false,
};

describe("大运与逐层流运", () => {
  it("大运顺逆遵循阴阳年干与性别", () => {
    expect(getLuckDirection("庚午", "male")?.forward).toBe(true);
    expect(getLuckDirection("庚午", "female")?.forward).toBe(false);
    expect(getLuckDirection("辛未", "female")?.forward).toBe(true);
    expect(getLuckDirection("辛未", "unspecified")).toBeNull();
  });

  it("生成十二步大运且每步十年", () => {
    const chart = calculateBaziChart("luck", INPUT);
    expect(chart.luckCycle?.items).toHaveLength(12);
    expect(chart.luckCycle!.items[1]!.startYear - chart.luckCycle!.items[0]!.startYear).toBe(10);
  });

  it("批量流年、选择后流月、流日、流时逐层生成", () => {
    const chart = calculateBaziChart("flows", INPUT);
    const natal = chart.pillars.filter((pillar): pillar is Pillar => pillar !== null);
    const years = generateFlowYears({ startYear: 2024, endYear: 2033, birthYear: 1990, birthMonth: 6, birthDay: 15, dayMaster: chart.dayMaster, natalPillars: natal, luckCycle: chart.luckCycle });
    expect(years).toHaveLength(10);
    expect(years[0]?.pillar.ganZhi).toBe("甲辰");
    const months = generateFlowMonths({ year: 2024, timezone: chart.calendar.timezone, dayMaster: chart.dayMaster, contexts: natal });
    expect(months).toHaveLength(12);
    expect(months[0]?.startTerm).toBe("立春");
    expect(months[0]?.endTerm).toBe("惊蛰");
    const days = generateFlowDays({ month: months[0]!, timezone: chart.calendar.timezone, dayMaster: chart.dayMaster, dayBoundaryRule: chart.input.dayBoundaryRule, contexts: natal });
    expect(days.length).toBeGreaterThanOrEqual(28);
    const hours = generateFlowHours({ date: days[0]!.date, dayMaster: chart.dayMaster, dayBoundaryRule: chart.input.dayBoundaryRule, contexts: natal });
    expect(hours).toHaveLength(12);
    expect(hours.map((hour) => hour.name)).toEqual(["子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时"]);
  });

  it("流月节令边界覆盖精确时刻，不按自然月", () => {
    const chart = calculateBaziChart("terms", INPUT);
    const natal = chart.pillars.filter((pillar): pillar is Pillar => pillar !== null);
    const months = generateFlowMonths({ year: 2024, timezone: "Asia/Shanghai", dayMaster: chart.dayMaster, contexts: natal });
    expect(months[0]?.endInstant).toBe(months[1]?.startInstant);
    expect(Temporal.Instant.from(months[0]!.startInstant).toZonedDateTimeISO("Asia/Shanghai").toPlainDateTime().toString()).toBe("2024-02-04T16:27:07");
  });
});
