import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";
import { SUPPORTED_LOCATIONS } from "./cities";
import { hourPillarsForDayStem, isValidGanZhi, monthPillarsForYearStem, parseGanZhi } from "./pillars";

export const SUPPORTED_YEAR_MIN = 1900;
export const SUPPORTED_YEAR_MAX = 2100;

export const birthInputSchema = z
  .object({
    name: z.string().trim().max(40, "称呼不能超过 40 个字符").optional(),
    gender: z.enum(["male", "female", "unspecified"]),
    calendarType: z.enum(["solar", "lunar", "pillars"]),
    directPillars: z
      .object({
        year: z.string(),
        month: z.string(),
        day: z.string(),
        hour: z.string(),
      })
      .optional(),
    year: z.number().int().min(SUPPORTED_YEAR_MIN).max(SUPPORTED_YEAR_MAX),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    isLeapMonth: z.boolean(),
    timeKnown: z.boolean(),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    locationId: z
      .string()
      .refine(
        (id) => SUPPORTED_LOCATIONS.some((city) => city.id === id),
        "请选择有效城市",
      ),
    timeMode: z.literal("localStandard"),
    dayBoundaryRule: z.enum(["lateZiNextDay", "midnight"]),
    showHiddenStems: z.boolean(),
    showTenGods: z.boolean(),
    showNaYin: z.boolean(),
    showGrowth: z.boolean(),
    showShenSha: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.calendarType === "pillars") {
      if (!value.directPillars) {
        context.addIssue({ code: "custom", path: ["directPillars"], message: "请选择年、月、日、时四柱" });
        return;
      }
      for (const [key, ganZhi] of Object.entries(value.directPillars)) {
        if (!isValidGanZhi(ganZhi)) {
          context.addIssue({ code: "custom", path: ["directPillars", key], message: `${ganZhi}不在六十甲子中` });
        }
      }
      if (Object.values(value.directPillars).every(isValidGanZhi)) {
        const yearStem = parseGanZhi(value.directPillars.year).stem;
        const dayStem = parseGanZhi(value.directPillars.day).stem;
        if (!monthPillarsForYearStem(yearStem).includes(value.directPillars.month)) {
          context.addIssue({ code: "custom", path: ["directPillars", "month"], message: "月柱与年干不符合五虎遁" });
        }
        if (!hourPillarsForDayStem(dayStem).includes(value.directPillars.hour)) {
          context.addIssue({ code: "custom", path: ["directPillars", "hour"], message: "时柱与日干不符合五鼠遁" });
        }
      }
      return;
    }
    if (value.calendarType === "solar") {
      try {
        Temporal.PlainDate.from(
          { year: value.year, month: value.month, day: value.day },
          { overflow: "reject" },
        );
      } catch {
        context.addIssue({
          code: "custom",
          path: ["day"],
          message: "公历日期不存在",
        });
      }
    } else if (value.day > 30) {
      context.addIssue({
        code: "custom",
        path: ["day"],
        message: "农历日期不能超过三十",
      });
    }
  });

export type BirthInputSchema = z.infer<typeof birthInputSchema>;
