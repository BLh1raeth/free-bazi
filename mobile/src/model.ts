import type { BirthInput } from "../../src/lib/bazi";

export type ChartRecord = {
  id: string;
  input: BirthInput;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  dayBoundaryRule: BirthInput["dayBoundaryRule"];
};

export const DEFAULT_SETTINGS: AppSettings = {
  dayBoundaryRule: "lateZiNextDay",
};

export const DEFAULT_BIRTH_INPUT: BirthInput = {
  name: "",
  gender: "male",
  calendarType: "solar",
  directPillars: { year: "甲子", month: "丙寅", day: "甲子", hour: "甲子" },
  year: 1990,
  month: 1,
  day: 1,
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
};
