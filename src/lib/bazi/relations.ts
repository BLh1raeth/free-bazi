import { elementControls, elementGenerates, stemElement } from "./ten-gods";
import type { Branch, Element, Pillar, Relation } from "./types";

const STEM_COMBINE_ELEMENT: Record<string, Element> = {
  甲己: "土", 己甲: "土",
  乙庚: "金", 庚乙: "金",
  丙辛: "水", 辛丙: "水",
  丁壬: "木", 壬丁: "木",
  戊癸: "火", 癸戊: "火",
};

const BRANCH_RELATIONS: Record<string, string[]> = {
  子丑: ["六合"], 丑子: ["六合"], 寅亥: ["六合", "六破"], 亥寅: ["六合", "六破"], 卯戌: ["六合"], 戌卯: ["六合"], 辰酉: ["六合"], 酉辰: ["六合"], 巳申: ["六合", "六破", "相刑"], 申巳: ["六合", "六破", "相刑"], 午未: ["六合"], 未午: ["六合"],
  子午: ["六冲"], 午子: ["六冲"], 丑未: ["六冲", "相刑"], 未丑: ["六冲", "相刑"], 寅申: ["六冲", "相刑"], 申寅: ["六冲", "相刑"], 卯酉: ["六冲"], 酉卯: ["六冲"], 辰戌: ["六冲"], 戌辰: ["六冲"], 巳亥: ["六冲"], 亥巳: ["六冲"],
  子未: ["六害"], 未子: ["六害"], 丑午: ["六害"], 午丑: ["六害"], 寅巳: ["六害", "相刑"], 巳寅: ["六害", "相刑"], 卯辰: ["六害"], 辰卯: ["六害"], 申亥: ["六害"], 亥申: ["六害"], 酉戌: ["六害"], 戌酉: ["六害"],
  子酉: ["六破"], 酉子: ["六破"], 丑辰: ["六破"], 辰丑: ["六破"], 卯午: ["六破"], 午卯: ["六破"], 未戌: ["六破", "相刑"], 戌未: ["六破", "相刑"],
  丑戌: ["相刑"], 戌丑: ["相刑"], 子卯: ["相刑"], 卯子: ["相刑"],
};

const BRANCH_COMBINE_ELEMENT: Record<string, Element> = {
  子丑: "土", 丑子: "土", 寅亥: "木", 亥寅: "木", 卯戌: "火", 戌卯: "火",
  辰酉: "金", 酉辰: "金", 巳申: "水", 申巳: "水", 午未: "土", 未午: "土",
};

const SELF_PUNISH = new Set<Branch>(["辰", "午", "酉", "亥"]);
const TRINES: Array<{ branches: readonly Branch[]; type: string; element: Element }> = [
  { branches: ["申", "子", "辰"], type: "三合水局", element: "水" },
  { branches: ["亥", "卯", "未"], type: "三合木局", element: "木" },
  { branches: ["寅", "午", "戌"], type: "三合火局", element: "火" },
  { branches: ["巳", "酉", "丑"], type: "三合金局", element: "金" },
];
const MEETINGS: Array<{ branches: readonly Branch[]; type: string; element: Element }> = [
  { branches: ["亥", "子", "丑"], type: "三会水局", element: "水" },
  { branches: ["寅", "卯", "辰"], type: "三会木局", element: "木" },
  { branches: ["巳", "午", "未"], type: "三会火局", element: "火" },
  { branches: ["申", "酉", "戌"], type: "三会金局", element: "金" },
];

export type RelationTone = "generate" | "control" | "combine" | "clash" | "punish" | "harm" | "break" | "neutral";

export interface PillarRelationMark {
  id: string;
  plane: "stem" | "branch";
  type: string;
  badge: string;
  detail: string;
  memberIndexes: number[];
  /** 生克时按起点、终点排序；其余关系仅表示参与列。 */
  direction?: [number, number];
  tone: RelationTone;
}

function findMemberIndexes(pillars: Pillar[], branches: readonly Branch[]): number[] | null {
  const used = new Set<number>();
  const indexes: number[] = [];
  for (const branch of branches) {
    const index = pillars.findIndex((pillar, candidate) => !used.has(candidate) && pillar.branch === branch);
    if (index < 0) return null;
    used.add(index);
    indexes.push(index);
  }
  return indexes.sort((a, b) => a - b);
}

function markTone(type: string): RelationTone {
  if (type.includes("合") || type.includes("会")) return "combine";
  if (type.includes("冲")) return "clash";
  if (type.includes("刑")) return "punish";
  if (type.includes("害")) return "harm";
  if (type.includes("破")) return "break";
  return "neutral";
}

/**
 * 为排盘图生成“具体到列”的关系。这里只断言规则命中；六合、三合、三会的
 * 五行是传统取象，不在缺少月令、透干等条件时直接断言已经合化成功。
 */
export function analyzePillarRelationMarks(pillars: Pillar[]): PillarRelationMark[] {
  const marks: PillarRelationMark[] = [];

  for (const group of [...TRINES, ...MEETINGS]) {
    const memberIndexes = findMemberIndexes(pillars, group.branches);
    if (!memberIndexes) continue;
    marks.push({
      id: `branch-${group.type}-${memberIndexes.join("-")}`,
      plane: "branch",
      type: group.type,
      badge: group.type,
      detail: `${group.branches.join("")}成${group.type}（是否化${group.element}仍需看全局条件）`,
      memberIndexes,
      tone: "combine",
    });
  }

  for (let sourceIndex = 0; sourceIndex < pillars.length; sourceIndex += 1) {
    for (let targetIndex = sourceIndex + 1; targetIndex < pillars.length; targetIndex += 1) {
      const source = pillars[sourceIndex]!;
      const target = pillars[targetIndex]!;
      const stemPair = `${source.stem}${target.stem}`;
      const combinedElement = STEM_COMBINE_ELEMENT[stemPair];
      if (combinedElement) {
        marks.push({
          id: `stem-combine-${sourceIndex}-${targetIndex}`,
          plane: "stem",
          type: "天干五合",
          badge: `合${combinedElement}`,
          detail: `${source.stem}${target.stem}合${combinedElement}（是否化成需看月令与全局）`,
          memberIndexes: [sourceIndex, targetIndex],
          tone: "combine",
        });
      } else {
        const sourceElement = source.stemElement;
        const targetElement = target.stemElement;
        if (elementGenerates(sourceElement, targetElement) || elementGenerates(targetElement, sourceElement)) {
          const direction: [number, number] = elementGenerates(sourceElement, targetElement)
            ? [sourceIndex, targetIndex]
            : [targetIndex, sourceIndex];
          marks.push({
            id: `stem-generate-${sourceIndex}-${targetIndex}`,
            plane: "stem",
            type: "天干相生",
            badge: "生",
            detail: `${pillars[direction[0]]!.stem}生${pillars[direction[1]]!.stem}`,
            memberIndexes: [sourceIndex, targetIndex],
            direction,
            tone: "generate",
          });
        } else if (elementControls(sourceElement, targetElement) || elementControls(targetElement, sourceElement)) {
          const direction: [number, number] = elementControls(sourceElement, targetElement)
            ? [sourceIndex, targetIndex]
            : [targetIndex, sourceIndex];
          marks.push({
            id: `stem-control-${sourceIndex}-${targetIndex}`,
            plane: "stem",
            type: "天干相克",
            badge: "克",
            detail: `${pillars[direction[0]]!.stem}克${pillars[direction[1]]!.stem}`,
            memberIndexes: [sourceIndex, targetIndex],
            direction,
            tone: "control",
          });
        }
      }

      const branchPair = `${source.branch}${target.branch}`;
      const branchTypes = source.branch === target.branch && SELF_PUNISH.has(source.branch)
        ? ["自刑"]
        : BRANCH_RELATIONS[branchPair] ?? [];
      for (const type of branchTypes) {
        const element = type === "六合" ? BRANCH_COMBINE_ELEMENT[branchPair] : undefined;
        marks.push({
          id: `branch-${type}-${sourceIndex}-${targetIndex}`,
          plane: "branch",
          type,
          badge: element ? `合${element}` : type.replace(/^六/, ""),
          detail: element
            ? `${source.branch}${target.branch}六合${element}（是否合化需看全局）`
            : `${source.branch}${target.branch}${type}`,
          memberIndexes: [sourceIndex, targetIndex],
          tone: markTone(type),
        });
      }
    }
  }

  return marks;
}

/** 图形层默认只保留肉眼不能由五行颜色直接读出的结构关系。 */
export function analyzeStructuralRelationMarks(pillars: Pillar[]): PillarRelationMark[] {
  return analyzePillarRelationMarks(pillars).filter(
    (mark) => mark.tone !== "generate" && mark.tone !== "control",
  );
}

export function isBranchClash(source: Branch, target: Branch): boolean {
  return (BRANCH_RELATIONS[`${source}${target}`] ?? []).includes("六冲");
}

export function isStemControl(source: Pillar, target: Pillar): boolean {
  return elementControls(stemElement(source.stem), stemElement(target.stem));
}

export function analyzeRelations(focus: Pillar, contexts: Pillar[]): Relation[] {
  const relations: Relation[] = [];
  for (const target of contexts) {
    const stemPair = `${focus.stem}${target.stem}`;
    if (STEM_COMBINE_ELEMENT[stemPair]) {
      relations.push({ source: focus.label, target: target.label, type: "天干五合", detail: `${stemPair}合` });
    } else {
      const sourceElement = stemElement(focus.stem);
      const targetElement = stemElement(target.stem);
      const type = sourceElement === targetElement ? "天干同类" : elementGenerates(sourceElement, targetElement) ? "天干相生" : elementControls(sourceElement, targetElement) ? "天干相克" : elementGenerates(targetElement, sourceElement) ? "天干受生" : "天干受克";
      relations.push({ source: focus.label, target: target.label, type, detail: `${focus.stem}与${target.stem}` });
    }
    const branchPair = `${focus.branch}${target.branch}`;
    const branchTypes = focus.branch === target.branch && SELF_PUNISH.has(focus.branch) ? ["自刑"] : BRANCH_RELATIONS[branchPair] ?? [];
    for (const branchType of branchTypes) relations.push({ source: focus.label, target: target.label, type: branchType, detail: `${focus.branch}${target.branch}` });
  }

  const allBranches = new Set([focus, ...contexts].map((pillar) => pillar.branch));
  for (const group of [...TRINES, ...MEETINGS]) {
    if (group.branches.every((branch) => allBranches.has(branch))) {
      relations.push({ source: focus.label, target: "当前层级", type: group.type, detail: group.branches.join("") });
    }
  }
  return relations;
}
