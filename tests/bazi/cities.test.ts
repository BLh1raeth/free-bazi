import { describe, expect, it } from "vitest";
import { CITIES, CITY_GROUPS, getCity } from "@/lib/bazi/cities";

describe("中国出生地点数据", () => {
  it("仅包含中国地区并覆盖省级分组", () => {
    expect(CITIES.every((city) => city.country === "中国")).toBe(true);
    expect(CITY_GROUPS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(CITIES.map((city) => city.id)).size).toBe(CITIES.length);
  });

  it("包含内地及港澳台主要城市的正确时区", () => {
    expect(getCity("shenzhen").province).toBe("广东省");
    expect(getCity("urumqi").timezone).toBe("Asia/Shanghai");
    expect(getCity("hong-kong").timezone).toBe("Asia/Hong_Kong");
    expect(getCity("taipei").timezone).toBe("Asia/Taipei");
  });
});
