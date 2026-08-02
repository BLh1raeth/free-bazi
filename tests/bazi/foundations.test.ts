import { describe, expect, it } from "vitest";
import { countFiveElements } from "@/lib/bazi/five-elements";
import { HIDDEN_STEMS } from "@/lib/bazi/hidden-stems";
import { createPillar, getCycleIndex, getGrowth, getNaYin, shiftGanZhi } from "@/lib/bazi/pillars";
import { getTenGod } from "@/lib/bazi/ten-gods";

describe("六十甲子与基础映射", () => {
  it("完整循环 60 位并正确跨界", () => {
    expect(getCycleIndex("甲子")).toBe(0);
    expect(getCycleIndex("癸亥")).toBe(59);
    expect(shiftGanZhi("癸亥", 1)).toBe("甲子");
    expect(shiftGanZhi("甲子", -1)).toBe("癸亥");
  });

  it("映射十神生克与阴阳", () => {
    expect(getTenGod("甲", "甲")).toBe("比肩");
    expect(getTenGod("甲", "乙")).toBe("劫财");
    expect(getTenGod("甲", "丙")).toBe("食神");
    expect(getTenGod("甲", "丁")).toBe("伤官");
    expect(getTenGod("甲", "戊")).toBe("偏财");
    expect(getTenGod("甲", "己")).toBe("正财");
    expect(getTenGod("甲", "庚")).toBe("七杀");
    expect(getTenGod("甲", "辛")).toBe("正官");
    expect(getTenGod("甲", "壬")).toBe("偏印");
    expect(getTenGod("甲", "癸")).toBe("正印");
  });

  it("地支藏干表与权重稳定", () => {
    expect(HIDDEN_STEMS.子).toEqual([{ stem: "癸", weight: 1 }]);
    expect(HIDDEN_STEMS.寅.map((item) => item.stem)).toEqual(["甲", "丙", "戊"]);
    for (const hidden of Object.values(HIDDEN_STEMS)) expect(hidden.reduce((sum, item) => sum + item.weight, 0)).toBeCloseTo(1);
  });

  it("纳音与十二长生使用完整周期", () => {
    expect(getNaYin("甲子")).toBe("海中金");
    expect(getNaYin("癸亥")).toBe("大海水");
    expect(getGrowth("甲", "亥")).toBe("长生");
    expect(getGrowth("乙", "午")).toBe("长生");
  });

  it("五行明字与藏干加权口径总量一致", () => {
    const dayMaster = "甲" as const;
    const pillars = [createPillar("natal", "年柱", "甲子", dayMaster), createPillar("natal", "月柱", "丙寅", dayMaster), createPillar("natal", "日柱", "甲午", dayMaster), createPillar("natal", "时柱", "癸酉", dayMaster)];
    const stats = countFiveElements(pillars);
    expect(Object.values(stats.visible).reduce((a, b) => a + b, 0)).toBe(8);
    expect(Object.values(stats.weighted).reduce((a, b) => a + b, 0)).toBeCloseTo(8);
  });
});
