import type { Element, Pillar, Stem } from "@/lib/bazi";

const ELEMENT_CLASS: Record<Element, string> = {
  木: "element-wood",
  火: "element-fire",
  土: "element-earth",
  金: "element-metal",
  水: "element-water",
};

const STEM_ELEMENT: Record<Stem, Element> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

export function elementClass(element: Element): string {
  return ELEMENT_CLASS[element];
}

export function ElementText({
  element,
  children,
  className = "",
}: {
  element: Element;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`${ELEMENT_CLASS[element]} ${className}`.trim()}>
      {children}
    </span>
  );
}

export function StemText({
  stem,
  className = "",
}: {
  stem: Stem;
  className?: string;
}) {
  return (
    <ElementText element={STEM_ELEMENT[stem]} className={className}>
      {stem}
    </ElementText>
  );
}

export function PillarText({
  pillar,
  className = "",
}: {
  pillar: Pillar;
  className?: string;
}) {
  return (
    <span
      className={`pillar-pair ${className}`.trim()}
      aria-label={`${pillar.ganZhi}，${pillar.stemElement}${pillar.branchElement}`}
    >
      <ElementText element={pillar.stemElement} className="element-glyph">
        {pillar.stem}
      </ElementText>
      <ElementText element={pillar.branchElement} className="element-glyph">
        {pillar.branch}
      </ElementText>
    </span>
  );
}
