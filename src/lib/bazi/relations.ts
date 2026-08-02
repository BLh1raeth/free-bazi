import { elementControls, elementGenerates, stemElement } from "./ten-gods";
import type { Pillar, Relation } from "./types";

const STEM_COMBINES = new Set(["甲己", "己甲", "乙庚", "庚乙", "丙辛", "辛丙", "丁壬", "壬丁", "戊癸", "癸戊"]);
const BRANCH_RELATIONS: Record<string, string[]> = {
  子丑: ["六合"], 丑子: ["六合"], 寅亥: ["六合", "六破"], 亥寅: ["六合", "六破"], 卯戌: ["六合"], 戌卯: ["六合"], 辰酉: ["六合"], 酉辰: ["六合"], 巳申: ["六合", "六破", "相刑"], 申巳: ["六合", "六破", "相刑"], 午未: ["六合"], 未午: ["六合"],
  子午: ["六冲"], 午子: ["六冲"], 丑未: ["六冲"], 未丑: ["六冲", "相刑"], 寅申: ["六冲"], 申寅: ["六冲", "相刑"], 卯酉: ["六冲"], 酉卯: ["六冲"], 辰戌: ["六冲"], 戌辰: ["六冲"], 巳亥: ["六冲"], 亥巳: ["六冲"],
  子未: ["六害"], 未子: ["六害"], 丑午: ["六害"], 午丑: ["六害"], 寅巳: ["六害", "相刑"], 巳寅: ["六害", "相刑"], 卯辰: ["六害"], 辰卯: ["六害"], 申亥: ["六害"], 亥申: ["六害"], 酉戌: ["六害"], 戌酉: ["六害"],
  子酉: ["六破"], 酉子: ["六破"], 丑辰: ["六破"], 辰丑: ["六破"], 卯午: ["六破"], 午卯: ["六破"], 未戌: ["六破", "相刑"], 戌未: ["六破", "相刑"],
  丑戌: ["相刑"], 戌丑: ["相刑"], 子卯: ["相刑"], 卯子: ["相刑"],
};
const SELF_PUNISH = new Set(["辰", "午", "酉", "亥"]);
const TRINES: Array<[string, string]> = [["申子辰", "三合水局"], ["亥卯未", "三合木局"], ["寅午戌", "三合火局"], ["巳酉丑", "三合金局"]];
const MEETINGS: Array<[string, string]> = [["亥子丑", "三会水局"], ["寅卯辰", "三会木局"], ["巳午未", "三会火局"], ["申酉戌", "三会金局"]];

export function analyzeRelations(focus: Pillar, contexts: Pillar[]): Relation[] {
  const relations: Relation[] = [];
  for (const target of contexts) {
    const stemPair = `${focus.stem}${target.stem}`;
    if (STEM_COMBINES.has(stemPair)) {
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
  for (const [set, type] of [...TRINES, ...MEETINGS]) {
    if ([...set].every((branch) => allBranches.has(branch as Pillar["branch"]))) relations.push({ source: focus.label, target: "当前层级", type, detail: set });
  }
  return relations;
}
