import { describe, expect, it } from "vitest";
import { createPillar } from "@/lib/bazi/pillars";
import { analyzeRelations } from "@/lib/bazi/relations";

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
});
