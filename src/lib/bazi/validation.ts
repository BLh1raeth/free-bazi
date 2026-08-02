import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";
import { CITIES } from "./cities";

export const SUPPORTED_YEAR_MIN = 1900;
export const SUPPORTED_YEAR_MAX = 2100;

export const birthInputSchema = z
  .object({
    name: z.string().trim().max(40, "称呼不能超过 40 个字符").optional(),
    gender: z.enum(["male", "female", "unspecified"]),
    calendarType: z.enum(["solar", "lunar"]),
    year: z.number().int().min(SUPPORTED_YEAR_MIN).max(SUPPORTED_YEAR_MAX),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    isLeapMonth: z.boolean(),
    timeKnown: z.boolean(),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    locationId: z.string().refine((id) => CITIES.some((city) => city.id === id), "请选择有效城市"),
    timeMode: z.literal("localStandard"),
    dayBoundaryRule: z.enum(["lateZiNextDay", "midnight"]),
    showHiddenStems: z.boolean(),
    showTenGods: z.boolean(),
    showNaYin: z.boolean(),
    showGrowth: z.boolean(),
    showShenSha: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.calendarType === "solar") {
      try {
        Temporal.PlainDate.from({ year: value.year, month: value.month, day: value.day }, { overflow: "reject" });
      } catch {
        context.addIssue({ code: "custom", path: ["day"], message: "公历日期不存在" });
      }
    } else if (value.day > 30) {
      context.addIssue({ code: "custom", path: ["day"], message: "农历日期不能超过三十" });
    }
  });

export type BirthInputSchema = z.infer<typeof birthInputSchema>;
