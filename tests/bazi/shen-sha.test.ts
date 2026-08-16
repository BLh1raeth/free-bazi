import { describe, expect, it } from "vitest";
import { createPillar } from "@/lib/bazi/pillars";
import { calculateShenSha, calculateTransitShenSha, SHEN_SHA_CATALOG, SHEN_SHA_STANDARD } from "@/lib/bazi/shen-sha";
import { BRANCHES, STEMS, type Branch, type Stem } from "@/lib/bazi/types";

function ganZhiAt(index: number): string {
  return `${STEMS[index % 10]}${BRANCHES[index % 12]}`;
}

function ganZhiWithStem(stem: Stem): string {
  const index = Array.from({ length: 60 }, (_, value) => value).find(
    (value) => STEMS[value % 10] === stem,
  )!;
  return ganZhiAt(index);
}

function ganZhiWithBranch(branch: Branch): string {
  const index = Array.from({ length: 60 }, (_, value) => value).find(
    (value) => BRANCHES[value % 12] === branch,
  )!;
  return ganZhiAt(index);
}

function hitForDayStem(dayStem: Stem, targetBranch: Branch) {
  const pillars = [
    createPillar("natal", "年柱", "甲戌", dayStem),
    createPillar("natal", "月柱", ganZhiWithBranch(targetBranch), dayStem),
    createPillar("natal", "日柱", ganZhiWithStem(dayStem), dayStem),
    null,
  ] as const;
  return calculateShenSha(pillars).filter((item) => item.targetPillar === "月柱");
}

describe("神煞常用表诀 v4", () => {
  it("版本、口径和来源显式可追踪", () => {
    expect(SHEN_SHA_STANDARD.id).toBe("sanming-common-v4");
    expect(SHEN_SHA_STANDARD.sources).toHaveLength(4);
    expect(SHEN_SHA_STANDARD.method).toContain("日干");
    expect(SHEN_SHA_STANDARD.method).toContain("月支");
    expect(SHEN_SHA_STANDARD.method).toContain("年日支");
  });

  it("规则目录完整公开且不存在重复名称", () => {
    expect(SHEN_SHA_CATALOG.length).toBe(42);
    expect(new Set(SHEN_SHA_CATALOG).size).toBe(SHEN_SHA_CATALOG.length);
    expect(SHEN_SHA_CATALOG).toContain("德秀贵人");
    expect(SHEN_SHA_CATALOG).not.toContain("德");
    expect(SHEN_SHA_CATALOG).not.toContain("秀");
  });

  it("v4 新增：天赦、四废、十恶大败按季节与日柱命中", () => {
    const springTianShe = [
      createPillar("natal", "年柱", "甲戌", "戊"),
      createPillar("natal", "月柱", "丙寅", "戊"),
      createPillar("natal", "日柱", "戊寅", "戊"),
      null,
    ] as const;
    expect(calculateShenSha(springTianShe).some((item) => item.name === "天赦" && item.targetPillar === "日柱")).toBe(true);

    const springFeiFei = [
      createPillar("natal", "年柱", "甲戌", "庚"),
      createPillar("natal", "月柱", "丙寅", "庚"),
      createPillar("natal", "日柱", "庚申", "庚"),
      null,
    ] as const;
    expect(calculateShenSha(springFeiFei).some((item) => item.name === "四废" && item.targetPillar === "日柱")).toBe(true);

    const shiE = [
      createPillar("natal", "年柱", "甲戌", "甲"),
      createPillar("natal", "月柱", "丙寅", "甲"),
      createPillar("natal", "日柱", "甲辰", "甲"),
      null,
    ] as const;
    expect(calculateShenSha(shiE).some((item) => item.name === "十恶大败" && item.targetPillar === "日柱")).toBe(true);
  });

  it("德秀贵人必须德秀两组干同见，不再单独误报德或秀", () => {
    const onlyDe = [
      createPillar("natal", "年柱", "丙寅", "甲"),
      createPillar("natal", "月柱", "丙寅", "甲"),
      createPillar("natal", "日柱", "甲子", "甲"),
      null,
    ] as const;
    expect(calculateShenSha(onlyDe).some((item) => item.name === "德秀贵人")).toBe(false);

    const both = [
      createPillar("natal", "年柱", "丙寅", "甲"),
      createPillar("natal", "月柱", "戊寅", "甲"),
      createPillar("natal", "日柱", "甲子", "甲"),
      null,
    ] as const;
    expect(calculateShenSha(both)).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "德秀贵人", targetPillar: "年柱" }),
      expect.objectContaining({ name: "德秀贵人", targetPillar: "月柱" }),
    ]));
  });

  it.each([
    ["甲", ["子", "午"]], ["乙", ["子", "午"]], ["丙", ["卯", "酉"]], ["丁", ["卯", "酉"]],
    ["戊", ["辰", "戌", "丑", "未"]], ["己", ["辰", "戌", "丑", "未"]],
    ["庚", ["寅", "亥"]], ["辛", ["寅", "亥"]], ["壬", ["巳", "申"]], ["癸", ["巳", "申"]],
  ] as Array<[Stem, Branch[]]>) ("日干%s的太极贵人完整映射", (stem, targets) => {
    for (const branch of BRANCHES) {
      expect(hitForDayStem(stem, branch).some((item) => item.name === "太极贵人")).toBe(targets.includes(branch));
    }
  });

  it.each([
    ["申", "午", "卯"], ["子", "午", "卯"], ["辰", "午", "卯"],
    ["寅", "子", "酉"], ["午", "子", "酉"], ["戌", "子", "酉"],
    ["亥", "酉", "午"], ["卯", "酉", "午"], ["未", "酉", "午"],
    ["巳", "卯", "子"], ["酉", "卯", "子"], ["丑", "卯", "子"],
  ] as Array<[Branch, Branch, Branch]>) ("%s三合组的灾煞%s、六厄%s", (basis, disaster, obstruction) => {
    for (const branch of BRANCHES) {
      const pillars = [
        createPillar("natal", "年柱", ganZhiWithBranch(basis), "甲"),
        createPillar("natal", "月柱", ganZhiWithBranch(branch), "甲"),
        createPillar("natal", "日柱", "甲寅", "甲"), null,
      ] as const;
      const hits = calculateShenSha(pillars).filter((item) => item.targetPillar === "月柱" && item.basis.includes("年柱"));
      expect(hits.some((item) => item.name === "灾煞")).toBe(branch === disaster);
      expect(hits.some((item) => item.name === "六厄")).toBe(branch === obstruction);
    }
  });

  it.each([
    ["丙子", "阴阳差错"], ["甲寅", "八专"], ["壬午", "九丑"], ["丁巳", "孤鸾"], ["庚辰", "魁罡"],
  ]) ("日柱%s命中%s日表", (ganZhi, name) => {
    const pillars = [
      createPillar("natal", "年柱", "甲子", "甲"),
      createPillar("natal", "月柱", "丙寅", "甲"),
      createPillar("natal", "日柱", ganZhi, ganZhi[0] as Stem), null,
    ] as const;
    expect(calculateShenSha(pillars)).toEqual(expect.arrayContaining([expect.objectContaining({ name, targetPillar: "日柱" })]));
  });

  it.each([
    ["甲", ["丑", "未"]], ["乙", ["子", "申"]], ["丙", ["亥", "酉"]],
    ["丁", ["亥", "酉"]], ["戊", ["丑", "未"]], ["己", ["子", "申"]],
    ["庚", ["丑", "未"]], ["辛", ["午", "寅"]], ["壬", ["卯", "巳"]],
    ["癸", ["卯", "巳"]],
  ] as Array<[Stem, Branch[]]>) ("日干%s的天乙贵人完整映射", (stem, targets) => {
    for (const branch of BRANCHES) {
      const names = hitForDayStem(stem, branch).map((item) => item.name);
      expect(names.includes("天乙贵人")).toBe(targets.includes(branch));
    }
  });

  it.each([
    ["甲", "寅"], ["乙", "卯"], ["丙", "巳"], ["丁", "午"], ["戊", "巳"],
    ["己", "午"], ["庚", "申"], ["辛", "酉"], ["壬", "亥"], ["癸", "子"],
  ] as Array<[Stem, Branch]>) ("日干%s的禄神为%s", (stem, target) => {
    for (const branch of BRANCHES) {
      const names = hitForDayStem(stem, branch).map((item) => item.name);
      expect(names.includes("禄神")).toBe(branch === target);
    }
  });

  it.each([
    ["甲", "辰"], ["乙", "巳"], ["丙", "未"], ["丁", "申"], ["戊", "未"],
    ["己", "申"], ["庚", "戌"], ["辛", "亥"], ["壬", "丑"], ["癸", "寅"],
  ] as Array<[Stem, Branch]>) ("日干%s的金舆为禄前二辰%s", (stem, target) => {
    for (const branch of BRANCHES) {
      const names = hitForDayStem(stem, branch).map((item) => item.name);
      expect(names.includes("金舆")).toBe(branch === target);
    }
  });

  it.each([
    ["甲", "巳"], ["乙", "午"], ["丙", "申"], ["丁", "酉"], ["戊", "申"],
    ["己", "酉"], ["庚", "亥"], ["辛", "子"], ["壬", "寅"], ["癸", "卯"],
  ] as Array<[Stem, Branch]>) ("日干%s的文昌贵人为%s", (stem, target) => {
    for (const branch of BRANCHES) {
      const names = hitForDayStem(stem, branch).map((item) => item.name);
      expect(names.includes("文昌贵人")).toBe(branch === target);
    }
  });

  it.each([
    ["甲", "卯"], ["丙", "午"], ["戊", "午"], ["庚", "酉"], ["壬", "子"],
  ] as Array<[Stem, Branch]>) ("阳日干%s的阳刃为%s", (stem, target) => {
    for (const branch of BRANCHES) {
      const names = hitForDayStem(stem, branch).map((item) => item.name);
      expect(names.includes("阳刃")).toBe(branch === target);
    }
  });

  it.each(["乙", "丁", "己", "辛", "癸"] as Stem[])("阴日干%s不套用阳刃表", (stem) => {
    for (const branch of BRANCHES) {
      expect(hitForDayStem(stem, branch).some((item) => item.name === "阳刃")).toBe(false);
    }
  });

  it.each([
    ["申", "寅", "辰", "子", "巳", "亥"], ["子", "寅", "辰", "子", "巳", "亥"],
    ["辰", "寅", "辰", "子", "巳", "亥"], ["寅", "申", "戌", "午", "亥", "巳"],
    ["午", "申", "戌", "午", "亥", "巳"], ["戌", "申", "戌", "午", "亥", "巳"],
    ["亥", "巳", "未", "卯", "申", "寅"], ["卯", "巳", "未", "卯", "申", "寅"],
    ["未", "巳", "未", "卯", "申", "寅"], ["巳", "亥", "丑", "酉", "寅", "申"],
    ["酉", "亥", "丑", "酉", "寅", "申"], ["丑", "亥", "丑", "酉", "寅", "申"],
  ] as Array<[Branch, Branch, Branch, Branch, Branch, Branch]>) (
    "%s三合组的驿马/华盖/将星/劫煞/亡神完整映射",
    (basis, horse, canopy, general, robbery, loss) => {
      const expected = { 驿马: horse, 华盖: canopy, 将星: general, 劫煞: robbery, 亡神: loss } as const;
      for (const [name, expectedBranch] of Object.entries(expected)) {
        for (const branch of BRANCHES) {
          const pillars = [
            createPillar("natal", "年柱", ganZhiWithBranch(basis), "甲"),
            createPillar("natal", "月柱", ganZhiWithBranch(branch), "甲"),
            createPillar("natal", "日柱", "甲寅", "甲"),
            null,
          ] as const;
          const hit = calculateShenSha(pillars).some(
            (item) => item.name === name && item.targetPillar === "月柱" && item.basis.includes("年柱"),
          );
          expect(hit).toBe(branch === expectedBranch);
        }
      }
    },
  );

  it.each([
    ["寅", "丁", undefined], ["卯", undefined, "申"], ["辰", "壬", undefined],
    ["巳", "辛", undefined], ["午", undefined, "亥"], ["未", "甲", undefined],
    ["申", "癸", undefined], ["酉", undefined, "寅"], ["戌", "丙", undefined],
    ["亥", "乙", undefined], ["子", undefined, "巳"], ["丑", "庚", undefined],
  ] as Array<[Branch, Stem | undefined, Branch | undefined]>)(
    "%s月天德完整映射",
    (monthBranch, targetStem, targetBranch) => {
      for (let index = 0; index < 60; index += 1) {
        const target = createPillar("natal", "年柱", ganZhiAt(index), "甲");
        const pillars = [
          target,
          createPillar("natal", "月柱", ganZhiWithBranch(monthBranch), "甲"),
          createPillar("natal", "日柱", "甲子", "甲"),
          null,
        ] as const;
        const hit = calculateShenSha(pillars).some(
          (item) => item.name === "天德贵人" && item.targetPillar === "年柱",
        );
        expect(hit).toBe(target.stem === targetStem || target.branch === targetBranch);
      }
    },
  );

  it.each([
    ["寅", "丙"], ["午", "丙"], ["戌", "丙"],
    ["亥", "甲"], ["卯", "甲"], ["未", "甲"],
    ["申", "壬"], ["子", "壬"], ["辰", "壬"],
    ["巳", "庚"], ["酉", "庚"], ["丑", "庚"],
  ] as Array<[Branch, Stem]>)("%s月的月德干为%s", (monthBranch, targetStem) => {
    for (let index = 0; index < 60; index += 1) {
      const target = createPillar("natal", "年柱", ganZhiAt(index), "甲");
      const pillars = [
        target,
        createPillar("natal", "月柱", ganZhiWithBranch(monthBranch), "甲"),
        createPillar("natal", "日柱", "甲子", "甲"),
        null,
      ] as const;
      const hit = calculateShenSha(pillars).some(
        (item) => item.name === "月德贵人" && item.targetPillar === "年柱",
      );
      expect(hit).toBe(target.stem === targetStem);
    }
  });

  it.each([
    ["子", "卯", "酉"], ["丑", "寅", "申"], ["寅", "丑", "未"], ["卯", "子", "午"],
    ["辰", "亥", "巳"], ["巳", "戌", "辰"], ["午", "酉", "卯"], ["未", "申", "寅"],
    ["申", "未", "丑"], ["酉", "午", "子"], ["戌", "巳", "亥"], ["亥", "辰", "戌"],
  ] as Array<[Branch, Branch, Branch]>)("%s年红鸾%s、天喜%s", (yearBranch, redLuan, tianXi) => {
    for (const branch of BRANCHES) {
      const pillars = [
        createPillar("natal", "年柱", ganZhiWithBranch(yearBranch), "甲"),
        createPillar("natal", "月柱", ganZhiWithBranch(branch), "甲"),
        createPillar("natal", "日柱", "甲寅", "甲"),
        null,
      ] as const;
      const hits = calculateShenSha(pillars).filter((item) => item.targetPillar === "月柱");
      expect(hits.some((item) => item.name === "红鸾")).toBe(branch === redLuan);
      expect(hits.some((item) => item.name === "天喜")).toBe(branch === tianXi);
    }
  });

  it("咸池按年日支三合组查支，不额外混入纳音条件", () => {
    const nonMatching = [
      createPillar("natal", "年柱", "甲戌", "戊"),
      createPillar("natal", "月柱", "癸酉", "丙"),
      createPillar("natal", "日柱", "戊子", "戊"),
      null,
    ] as const;
    expect(calculateShenSha(nonMatching).some((item) => item.name === "咸池")).toBe(true);

    const matching = [
      createPillar("natal", "年柱", "丙子", "丙"),
      createPillar("natal", "月柱", "癸酉", "丙"),
      createPillar("natal", "日柱", "甲辰", "丙"),
      null,
    ] as const;
    expect(calculateShenSha(matching)).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "咸池", targetPillar: "月柱" }),
    ]));
  });

  it("缺少时柱时不修改输入，并合并同一命中的年支与日支依据", () => {
    const pillars = [
      createPillar("natal", "年柱", "甲申", "丙"),
      createPillar("natal", "月柱", "丙寅", "丙"),
      createPillar("natal", "日柱", "丙子", "丙"),
      null,
    ] as const;
    const snapshot = [...pillars];
    const horse = calculateShenSha(pillars).find(
      (item) => item.name === "驿马" && item.targetPillar === "月柱",
    );
    expect(horse?.basis).toContain("年柱申");
    expect(horse?.basis).toContain("日柱子");
    expect(pillars).toEqual(snapshot);
  });

  it("同一柱可稳定返回多个规则命中，而不是只保留首项", () => {
    const pillars = [
      createPillar("natal", "年柱", "戊子", "壬"),
      createPillar("natal", "月柱", "丁巳", "壬"),
      createPillar("natal", "日柱", "壬子", "壬"),
      createPillar("natal", "时柱", "癸卯", "壬"),
    ] as const;
    const byPillar = calculateShenSha(pillars).filter((item) => item.targetPillar === "时柱");
    expect(byPillar.length).toBeGreaterThan(1);
    expect(new Set(byPillar.map((item) => item.name)).size).toBe(byPillar.length);
  });

  it("大运流年等时运以原局年、月、日为基准独立查取", () => {
    const natal = [
      createPillar("natal", "年柱", "戊子", "壬"),
      createPillar("natal", "月柱", "丁巳", "壬"),
      createPillar("natal", "日柱", "壬子", "壬"),
      createPillar("natal", "时柱", "癸卯", "壬"),
    ] as const;
    const transit = createPillar("year", "2026流年", "丙午", "壬");
    const hits = calculateTransitShenSha(natal, [transit]);
    expect(hits.every((item) => item.targetPillar === "2026流年")).toBe(true);
    expect(hits.length).toBeGreaterThan(0);
  });
});
