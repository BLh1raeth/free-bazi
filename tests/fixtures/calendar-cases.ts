export const CALENDAR_CASES = [
  {
    id: "hko-2024-new-year",
    solar: { year: 2024, month: 2, day: 10 },
    lunar: { year: 2024, month: 1, day: 1, leap: false },
    source: "香港天文台《2024 公历与农历日期对照表》",
  },
  {
    id: "hko-2023-leap-second-month",
    solar: { year: 2023, month: 3, day: 22 },
    lunar: { year: 2023, month: 2, day: 1, leap: true },
    source: "香港天文台《2023 公历与农历日期对照表》",
  },
] as const;

export const TERM_CASES = {
  liChun2024: "2024-02-04 16:27:07",
  jingZhe2024: "2024-03-05 10:22:45",
  source: "lunar-typescript 节气表；日期与香港天文台 2024 年历交叉核对",
} as const;
