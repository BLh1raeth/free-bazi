import type { Branch, Pillar, ShenSha, Stem } from "./types";

type BranchRule = {
  桃花: Branch;
  驿马: Branch;
  华盖: Branch;
  将星: Branch;
};

const BRANCH_RULES: Record<Branch, BranchRule> = {
  申: { 桃花: "酉", 驿马: "寅", 华盖: "辰", 将星: "子" },
  子: { 桃花: "酉", 驿马: "寅", 华盖: "辰", 将星: "子" },
  辰: { 桃花: "酉", 驿马: "寅", 华盖: "辰", 将星: "子" },
  寅: { 桃花: "卯", 驿马: "申", 华盖: "戌", 将星: "午" },
  午: { 桃花: "卯", 驿马: "申", 华盖: "戌", 将星: "午" },
  戌: { 桃花: "卯", 驿马: "申", 华盖: "戌", 将星: "午" },
  亥: { 桃花: "子", 驿马: "巳", 华盖: "未", 将星: "卯" },
  卯: { 桃花: "子", 驿马: "巳", 华盖: "未", 将星: "卯" },
  未: { 桃花: "子", 驿马: "巳", 华盖: "未", 将星: "卯" },
  巳: { 桃花: "午", 驿马: "亥", 华盖: "丑", 将星: "酉" },
  酉: { 桃花: "午", 驿马: "亥", 华盖: "丑", 将星: "酉" },
  丑: { 桃花: "午", 驿马: "亥", 华盖: "丑", 将星: "酉" },
};

const WEN_CHANG: Record<Stem, Branch> = {
  甲: "巳",
  乙: "午",
  丙: "申",
  丁: "酉",
  戊: "申",
  己: "酉",
  庚: "亥",
  辛: "子",
  壬: "寅",
  癸: "卯",
};

const BRANCH_NAMES = ["桃花", "驿马", "华盖", "将星"] as const;

export function calculateShenSha(pillars: Array<Pillar | null>): ShenSha[] {
  const natal = pillars.filter((pillar): pillar is Pillar => pillar !== null);
  const year = natal.find((pillar) => pillar.label === "年柱");
  const day = natal.find((pillar) => pillar.label === "日柱");
  if (!year || !day) return [];

  const hits = new Map<string, ShenSha & { basisParts: string[] }>();
  const references = [
    { label: "年支", branch: year.branch },
    { label: "日支", branch: day.branch },
  ];

  for (const name of BRANCH_NAMES) {
    for (const reference of references) {
      const targetBranch = BRANCH_RULES[reference.branch][name];
      for (const target of natal.filter(
        (pillar) => pillar.branch === targetBranch,
      )) {
        const key = `${name}:${target.label}`;
        const basisPart = `${reference.label}${reference.branch}`;
        const current = hits.get(key);
        if (current) {
          if (!current.basisParts.includes(basisPart))
            current.basisParts.push(basisPart);
          current.basis = current.basisParts.join("、");
        } else {
          hits.set(key, {
            name,
            targetPillar: target.label,
            targetBranch,
            basis: basisPart,
            basisParts: [basisPart],
            rule: `以年支或日支查${name}，${reference.branch}组见${targetBranch}`,
          });
        }
      }
    }
  }

  const wenChangBranch = WEN_CHANG[day.stem];
  for (const target of natal.filter(
    (pillar) => pillar.branch === wenChangBranch,
  )) {
    hits.set(`文昌:${target.label}`, {
      name: "文昌",
      targetPillar: target.label,
      targetBranch: wenChangBranch,
      basis: `日干${day.stem}`,
      basisParts: [`日干${day.stem}`],
      rule: `以日干查文昌，${day.stem}见${wenChangBranch}`,
    });
  }

  return Array.from(hits.values()).map((hit) => ({
    name: hit.name,
    targetPillar: hit.targetPillar,
    targetBranch: hit.targetBranch,
    basis: hit.basis,
    rule: hit.rule,
  }));
}
