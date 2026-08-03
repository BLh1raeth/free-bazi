import { describe, expect, it } from "vitest";
import { createPillar } from "@/lib/bazi/pillars";
import { calculateShenSha } from "@/lib/bazi/shen-sha";

describe("常见神煞", () => {
  it("按年支和日支识别桃花、华盖与将星", () => {
    const pillars = [
      createPillar("natal", "年柱", "甲申", "丙"),
      createPillar("natal", "月柱", "乙酉", "丙"),
      createPillar("natal", "日柱", "丙子", "丙"),
      createPillar("natal", "时柱", "戊辰", "丙"),
    ];
    const hits = calculateShenSha(pillars);
    expect(hits.map((item) => `${item.name}:${item.targetPillar}`)).toEqual(
      expect.arrayContaining(["桃花:月柱", "华盖:时柱", "将星:日柱"]),
    );
    expect(hits.find((item) => item.name === "桃花")?.basis).toContain(
      "年支申",
    );
    expect(hits.find((item) => item.name === "桃花")?.basis).toContain(
      "日支子",
    );
  });

  it("按日干识别文昌并在无时柱时保持纯函数稳定", () => {
    const year = createPillar("natal", "年柱", "甲申", "丙");
    const month = createPillar("natal", "月柱", "乙丑", "丙");
    const day = createPillar("natal", "日柱", "丙午", "丙");
    const hits = calculateShenSha([year, month, day, null]);
    expect(hits).toContainEqual(
      expect.objectContaining({
        name: "文昌",
        targetPillar: "年柱",
        targetBranch: "申",
        basis: "日干丙",
      }),
    );
    expect(calculateShenSha([year, month, day, null])).toEqual(hits);
  });
});
