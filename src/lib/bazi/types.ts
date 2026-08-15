export const STEMS = [
  "甲",
  "乙",
  "丙",
  "丁",
  "戊",
  "己",
  "庚",
  "辛",
  "壬",
  "癸",
] as const;
export const BRANCHES = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
] as const;
export const ELEMENTS = ["木", "火", "土", "金", "水"] as const;

export type Stem = (typeof STEMS)[number];
export type Branch = (typeof BRANCHES)[number];
export type Element = (typeof ELEMENTS)[number];
export type Gender = "male" | "female" | "unspecified";
export type CalendarType = "solar" | "lunar" | "pillars";
export type DayBoundaryRule = "lateZiNextDay" | "midnight";

export interface DirectPillarsInput {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export interface LocationOption {
  id: string;
  country: string;
  province: string;
  city: string;
  timezone: string;
  longitude: number;
  latitude: number;
}

export interface BirthInput {
  name?: string;
  gender: Gender;
  calendarType: CalendarType;
  /** 四柱直排时使用；该模式不伪造出生日期、节令或起运信息。 */
  directPillars?: DirectPillarsInput;
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  timeKnown: boolean;
  hour: number;
  minute: number;
  locationId: string;
  timeMode: "localStandard" | "trueSolar";
  dayBoundaryRule: DayBoundaryRule;
  showHiddenStems: boolean;
  showTenGods: boolean;
  showNaYin: boolean;
  showGrowth: boolean;
  showShenSha: boolean;
}

export interface HiddenStem {
  stem: Stem;
  weight: number;
  tenGod: string;
}

export interface Pillar {
  level: "natal" | "luck" | "year" | "month" | "day" | "hour";
  label: string;
  ganZhi: string;
  stem: Stem;
  branch: Branch;
  stemElement: Element;
  branchElement: Element;
  stemYinYang: "阳" | "阴";
  branchYinYang: "阳" | "阴";
  tenGod: string;
  branchTenGod: string;
  hiddenStems: HiddenStem[];
  naYin: string;
  growth: string;
  voidBranches: string;
}

export interface FiveElementStats {
  visible: Record<Element, number>;
  weighted: Record<Element, number>;
}

export interface CalendarContext {
  inputCalendarText: string;
  solarText: string;
  lunarText: string;
  calculationText: string;
  timezone: string;
  utcOffset: string;
  location: LocationOption;
  instantIso?: string;
}

export interface LuckCycleItem {
  index: number;
  pillar: Pillar;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface MinorLuckItem {
  year: number;
  age: number;
  pillar: Pillar;
}

export interface LuckCycleResult {
  forward: boolean;
  directionReason: string;
  startAge: { years: number; months: number; days: number };
  startDate: string;
  rule: string;
  minorLuck: MinorLuckItem[];
  items: LuckCycleItem[];
}

export interface Relation {
  source: string;
  target: string;
  type: string;
  detail: string;
}

export interface ShenSha {
  name: string;
  targetPillar: string;
  targetBranch: Branch;
  basis: string;
  rule: string;
  standardId: string;
}

export interface FlowYear {
  year: number;
  pillar: Pillar;
  nominalAge: number;
  fullAge: number;
  luckIndex?: number;
  relations: Relation[];
}

export interface FlowMonth {
  id: string;
  name: string;
  pillar: Pillar;
  startTerm: string;
  endTerm: string;
  startLocal: string;
  endLocal: string;
  startInstant: string;
  endInstant: string;
  luckHandoffs: string[];
  relations: Relation[];
}

export interface FlowDay {
  date: string;
  lunarText: string;
  weekText: string;
  pillar: Pillar;
  relations: Relation[];
}

export interface FlowHour {
  index: number;
  name: string;
  timeRange: string;
  pillar: Pillar;
  relations: Relation[];
}

export interface BaziChart {
  id: string;
  input: BirthInput;
  calendar: CalendarContext;
  dayMaster: Stem;
  pillars: [Pillar, Pillar, Pillar, Pillar | null];
  fiveElements: FiveElementStats;
  taiYuan: string;
  mingGong: string;
  shenGong: string;
  luckCycle: LuckCycleResult | null;
  shenSha: ShenSha[];
  rules: string[];
  warnings: string[];
}
