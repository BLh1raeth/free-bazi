import { HIDDEN_STEMS } from "./hidden-stems";
import { stemElement } from "./ten-gods";
import { ELEMENTS, type Branch, type Element, type FiveElementStats, type Pillar } from "./types";

const BRANCH_ELEMENTS: Record<Branch, Element> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

export function branchElement(branch: Branch): Element {
  return BRANCH_ELEMENTS[branch];
}

function emptyCounts(): Record<Element, number> {
  return Object.fromEntries(ELEMENTS.map((element) => [element, 0])) as Record<Element, number>;
}

export function countFiveElements(pillars: Array<Pillar | null>): FiveElementStats {
  const visible = emptyCounts();
  const weighted = emptyCounts();
  for (const pillar of pillars) {
    if (!pillar) continue;
    visible[pillar.stemElement] += 1;
    visible[pillar.branchElement] += 1;
    weighted[pillar.stemElement] += 1;
    for (const hidden of HIDDEN_STEMS[pillar.branch]) weighted[stemElement(hidden.stem)] += hidden.weight;
  }
  for (const element of ELEMENTS) weighted[element] = Number(weighted[element].toFixed(2));
  return { visible, weighted };
}
