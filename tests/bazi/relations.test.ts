import { describe, expect, it } from "vitest";
import { createPillar } from "@/lib/bazi/pillars";
import { analyzePillarRelationMarks, analyzeRelations } from "@/lib/bazi/relations";

describe("干支关系", () => {
  it("识别天干五合和地支六合/冲刑害破", () => {
    const focus = createPillar("year", "流年", "甲子", "甲");
    const target = createPillar("natal", "原局", "己未", "甲");
    const types = analyzeRelations(focus, [target]).map((item) => item.type);
    expect(types).toContain("天干五合");
    expect(types).toContain("六害");
  });

  it("上下文完整时识别三合与三会", () => {
    const focus = createPillar("year", "流年", "甲申", "甲");
    const contexts = [createPillar("natal", "年柱", "丙子", "甲"), createPillar("natal", "月柱", "戊辰", "甲")];
    expect(analyzeRelations(focus, contexts).map((item) => item.type)).toContain("三合水局");
  });

  it("关系图返回精确列索引、方向和合局但不武断断言合化", () => {
    const pillars = [
      createPillar("natal", "年柱", "丙午", "甲"),
      createPillar("natal", "月柱", "丁巳", "甲"),
      createPillar("natal", "日柱", "壬寅", "甲"),
      createPillar("natal", "时柱", "癸未", "甲"),
    ];
    const marks = analyzePillarRelationMarks(pillars);
    expect(marks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "三会火局", memberIndexes: [0, 1, 3] }),
      expect.objectContaining({ type: "天干五合", memberIndexes: [1, 2], badge: "合木" }),
    ]));
    expect(marks.find((mark) => mark.type === "三会火局")?.detail).toContain("是否化火");
  });
});
