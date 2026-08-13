import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { calculateBaziChart } from "@/lib/bazi/four-pillars";
import { generateFlowDays, generateFlowHours, generateFlowMonths, generateFlowYears, generateFlowYearsForLuck, generateMinorLuckFlowYears } from "@/lib/bazi/flows";
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

  it("切换大运后保留首尾交接年，共生成十一个流年", () => {
    const chart = calculateBaziChart("luck-years", INPUT);
    const natal = chart.pillars.filter((pillar): pillar is Pillar => pillar !== null);
    const selectedLuck = chart.luckCycle!.items[3]!;
    const years = generateFlowYearsForLuck({
      fallbackYear: 2026,
      selectedLuck,
      birthYear: chart.input.year,
      birthMonth: chart.input.month,
      birthDay: chart.input.day,
      dayMaster: chart.dayMaster,
      natalPillars: natal,
      luckCycle: chart.luckCycle,
    });
    expect(years).toHaveLength(11);
    expect(years.map((item) => item.year)).toEqual(
      Array.from({ length: 11 }, (_, index) => selectedLuck.startYear + index),
    );
    expect(years[0]?.luckIndex === selectedLuck.index || years[0]?.luckIndex === selectedLuck.index - 1).toBe(true);
    expect(years.slice(1, 10).every((item) => item.luckIndex === selectedLuck.index)).toBe(true);
    expect([selectedLuck.index, selectedLuck.index + 1]).toContain(years.at(-1)?.luckIndex);
  });

  it("选择小运后只生成起运前对应流年", () => {
    const chart = calculateBaziChart("minor-years", INPUT);
    const natal = chart.pillars.filter((pillar): pillar is Pillar => pillar !== null);
    const years = generateMinorLuckFlowYears({
      birthYear: chart.input.year,
      birthMonth: chart.input.month,
      birthDay: chart.input.day,
      dayMaster: chart.dayMaster,
      natalPillars: natal,
      luckCycle: chart.luckCycle!,
    });
    expect(years.map((item) => item.year)).toEqual(chart.luckCycle!.minorLuck.map((item) => item.year));
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

  it("流月按精确日期标注交大运，起运前生成小运", () => {
    const chart = calculateBaziChart("handoff", INPUT);
    const natal = chart.pillars.filter((pillar): pillar is Pillar => pillar !== null);
    expect(chart.luckCycle?.minorLuck.length).toBeGreaterThan(0);
    const handoffYear = Number(chart.luckCycle!.items[0]!.startDate.slice(0, 4));
    const months = generateFlowMonths({ year: handoffYear, timezone: chart.calendar.timezone, dayMaster: chart.dayMaster, contexts: natal, luckCycle: chart.luckCycle });
    expect(months.flatMap((month) => month.luckHandoffs).some((text) => text.includes("交") && text.includes("大运"))).toBe(true);
  });
});
