import { ELEMENTS, STEMS, type Element, type Stem } from "./types";

const STEM_ELEMENTS: Record<Stem, Element> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

export function stemElement(stem: Stem): Element {
  return STEM_ELEMENTS[stem];
}

export function stemYinYang(stem: Stem): "阳" | "阴" {
  return STEMS.indexOf(stem) % 2 === 0 ? "阳" : "阴";
}

export function elementGenerates(source: Element, target: Element): boolean {
  return (ELEMENTS.indexOf(source) + 1) % 5 === ELEMENTS.indexOf(target);
}

export function elementControls(source: Element, target: Element): boolean {
  return (ELEMENTS.indexOf(source) + 2) % 5 === ELEMENTS.indexOf(target);
}

export function getTenGod(dayMaster: Stem, target: Stem): string {
  if (dayMaster === target) return "比肩";
  const dayElement = stemElement(dayMaster);
  const targetElement = stemElement(target);
  const samePolarity = stemYinYang(dayMaster) === stemYinYang(target);

  if (dayElement === targetElement) return samePolarity ? "比肩" : "劫财";
  if (elementGenerates(dayElement, targetElement)) return samePolarity ? "食神" : "伤官";
  if (elementGenerates(targetElement, dayElement)) return samePolarity ? "偏印" : "正印";
  if (elementControls(dayElement, targetElement)) return samePolarity ? "偏财" : "正财";
  return samePolarity ? "七杀" : "正官";
}
