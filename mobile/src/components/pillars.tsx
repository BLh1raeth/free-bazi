import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  analyzeStructuralRelationMarks,
  calculateTransitShenSha,
  getGrowth,
  type BaziChart,
  type Pillar,
  type PillarRelationMark,
  type RelationTone,
} from "../../../src/lib/bazi";
import { stemElement } from "../../../src/lib/bazi/ten-gods";
import { elementColors, palette, radii } from "../theme";
import { DataCard, SectionHeading, SystemGlassButton } from "./ui";

function pillarTitle(pillar: Pillar): string {
  if (pillar.level === "luck") return pillar.label.includes("小运") ? "小运" : "大运";
  if (pillar.level === "year") return "流年";
  if (pillar.level === "month") return "流月";
  if (pillar.level === "day") return "流日";
  if (pillar.level === "hour") return "流时";
  return pillar.label;
}

function mainTenGod(pillar: Pillar): string {
  return pillar.level === "natal" && pillar.label === "日柱" ? "日主" : pillar.tenGod;
}

function gridMetrics(count: number) {
  const compact = count >= 7;
  const veryCompact = count >= 9;
  return {
    compact,
    labelWidth: veryCompact ? 24 : compact ? 27 : 34,
    headerHeight: compact ? 26 : 30,
    godHeight: compact ? 27 : 30,
    glyphHeight: compact ? 40 : 48,
    hiddenHeight: compact ? 73 : 78,
    glyphSize: veryCompact ? 21 : count >= 7 ? 25 : count >= 5 ? 28 : 33,
    headerSize: veryCompact ? 10 : compact ? 10 : 12,
    detailSize: veryCompact ? 9 : compact ? 9 : 10,
  };
}

function GridCell({
  children,
  height,
  style,
}: {
  children?: React.ReactNode;
  height: number;
  style?: object;
}) {
  return <View style={[styles.gridCell, { height }, style]}>{children}</View>;
}

export function PillarMatrix({
  pillars,
  accessibilityLabel = "干支命盘",
  showHiddenStems = true,
  splitAfter = 0,
}: {
  pillars: Pillar[];
  accessibilityLabel?: string;
  showHiddenStems?: boolean;
  splitAfter?: number;
}) {
  const metrics = gridMetrics(pillars.length);
  return (
    <DataCard accessibilityLabel={accessibilityLabel} style={styles.matrixCard}>
      <View style={styles.matrixRow}>
        <View style={[styles.labelColumn, { width: metrics.labelWidth }]}>
          <GridCell height={metrics.headerHeight} style={styles.bottomBorder} />
          <GridCell height={metrics.godHeight}><Text style={styles.rowLabel}>主星</Text></GridCell>
          <GridCell height={metrics.glyphHeight}><Text style={styles.rowLabel}>天干</Text></GridCell>
          <GridCell height={metrics.glyphHeight}><Text style={styles.rowLabel}>地支</Text></GridCell>
          {showHiddenStems ? <GridCell height={metrics.hiddenHeight}><Text style={styles.rowLabel}>藏干</Text></GridCell> : null}
        </View>
        <View style={styles.flexColumns}>
          {pillars.map((pillar, index) => (
            <View key={`${pillar.level}-${pillar.label}-${pillar.ganZhi}-${index}`} style={[styles.pillarColumn, splitAfter > 0 && index === splitAfter && styles.pillarColumnSplit]}>
              <GridCell height={metrics.headerHeight} style={styles.bottomBorder}>
                <Text adjustsFontSizeToFit minimumFontScale={0.68} numberOfLines={1} style={[styles.pillarHeader, { fontSize: metrics.headerSize }]}>{pillarTitle(pillar)}</Text>
              </GridCell>
              <GridCell height={metrics.godHeight}>
                <Text adjustsFontSizeToFit minimumFontScale={0.65} numberOfLines={1} style={[styles.mainGod, { fontSize: metrics.detailSize }]}>{mainTenGod(pillar)}</Text>
              </GridCell>
              <GridCell height={metrics.glyphHeight}>
                <Text style={[styles.glyph, { color: elementColors[pillar.stemElement], fontSize: metrics.glyphSize }]}>{pillar.stem}</Text>
              </GridCell>
              <GridCell height={metrics.glyphHeight}>
                <Text style={[styles.glyph, { color: elementColors[pillar.branchElement], fontSize: metrics.glyphSize }]}>{pillar.branch}</Text>
              </GridCell>
              {showHiddenStems ? (
                <GridCell height={metrics.hiddenHeight} style={styles.hiddenStems}>
                  {pillar.hiddenStems.map((hidden) => (
                    <Text numberOfLines={1} style={[styles.hiddenStem, { fontSize: metrics.detailSize }]} key={`${hidden.stem}-${hidden.tenGod}`}>
                      <Text style={{ color: elementColors[stemElement(hidden.stem)] }}>{hidden.stem}</Text>
                      ·{hidden.tenGod}
                    </Text>
                  ))}
                </GridCell>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </DataCard>
  );
}

export function NatalDetails({ chart, pillars, splitAfter = 0 }: { chart: BaziChart; pillars?: Pillar[]; splitAfter?: number }) {
  const values = pillars ?? chart.pillars.filter((pillar): pillar is Pillar => !!pillar);
  const metrics = gridMetrics(values.length);
  const rows = [
    { label: "星运", values: values.map((pillar) => pillar.growth) },
    { label: "自坐", values: values.map((pillar) => getGrowth(pillar.stem, pillar.branch)) },
    { label: "空亡", values: values.map((pillar) => pillar.voidBranches) },
    { label: "纳音", values: values.map((pillar) => pillar.naYin) },
  ];

  return (
    <DataCard style={styles.detailCard} accessibilityLabel="命盘详细信息">
      {rows.map((row, rowIndex) => (
        <View key={row.label} style={[styles.detailRow, rowIndex > 0 && styles.detailRowBorder]}>
          <GridCell height={31} style={{ width: metrics.labelWidth }}><Text style={styles.detailLabel}>{row.label}</Text></GridCell>
          <View style={styles.flexColumns}>
            {row.values.map((value, index) => (
              <GridCell key={`${row.label}-${index}`} height={31} style={[styles.detailValueCell, splitAfter > 0 && index === splitAfter && styles.detailValueSplit]}>
                <Text adjustsFontSizeToFit minimumFontScale={0.58} numberOfLines={1} style={[styles.detailValue, { fontSize: metrics.detailSize }]}>{value}</Text>
              </GridCell>
            ))}
          </View>
        </View>
      ))}
    </DataCard>
  );
}

export function ShenShaMatrix({ chart, pillars, splitAfter = 0 }: { chart: BaziChart; pillars: Pillar[]; splitAfter?: number }) {
  const [expanded, setExpanded] = useState(false);
  const metrics = gridMetrics(pillars.length);
  const natal = chart.pillars.filter((pillar): pillar is Pillar => pillar !== null);
  const hits = calculateTransitShenSha(natal, pillars);
  const byPillar = pillars.map((pillar) => hits.filter((item) => item.targetPillar === pillar.label));
  const maxHits = Math.max(0, ...byPillar.map((items) => items.length));
  const hasHits = maxHits > 0;
  const visibleMax = expanded ? Math.max(1, ...byPillar.map((items) => items.length)) : 0;
  const rowHeight = expanded ? Math.max(64, 18 + visibleMax * 17) : 0;
  return (
    <DataCard style={styles.detailCard} accessibilityLabel="神煞规则命中">
      <View style={styles.shenShaHeader}>
        <Text style={styles.shenShaTitle}>神煞</Text>
        {hasHits ? <SystemGlassButton fontSize={13} label={expanded ? "收起" : "展开"} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded((value) => !value); }} style={styles.shenShaToggle} /> : null}
      </View>
      {expanded ? <View style={styles.detailRow}>
        <GridCell height={rowHeight} style={{ width: metrics.labelWidth }}><Text style={styles.detailLabel}>神煞</Text></GridCell>
        <View style={styles.flexColumns}>
          {byPillar.map((items, index) => (
            <GridCell key={`${pillars[index]?.label}-${index}`} height={rowHeight} style={[styles.detailValueCell, styles.shenShaCell, splitAfter > 0 && index === splitAfter && styles.detailValueSplit]}>
              {items.length ? items.map((item) => (
                <Text numberOfLines={1} key={`${item.name}-${item.basis}`} style={[styles.shenShaItem, { fontSize: Math.max(8, metrics.detailSize) }]}>{item.name}</Text>
              )) : <Text style={styles.shenShaEmpty}>—</Text>}
            </GridCell>
          ))}
        </View>
      </View> : null}
    </DataCard>
  );
}

export type FortuneColumn = {
  id: string;
  top: string;
  pillar: Pillar;
  stemGod: string;
  branchGod: string;
  footer?: string;
  annotations?: string[];
  accent?: string;
  stemText?: string;
  branchText?: string;
};

export function CompactFortuneTable({
  title,
  columns,
  leading,
  selectedId,
  onSelect,
  onHorizontalGestureChange,
}: {
  title: string;
  columns: FortuneColumn[];
  leading?: FortuneColumn;
  selectedId?: string;
  onSelect: (item: FortuneColumn) => void;
  onHorizontalGestureChange?: (active: boolean) => void;
}) {
  const values = leading ? [leading, ...columns] : columns;
  return (
    <DataCard style={styles.compactFortuneCard} contentStyle={styles.compactFortuneContent}>
      <View style={styles.compactFortuneHeader}><Text style={styles.compactFortuneTitle}>{title}</Text></View>
      <View
        onStartShouldSetResponderCapture={() => {
          onHorizontalGestureChange?.(true);
          return false;
        }}
        onTouchCancel={() => onHorizontalGestureChange?.(false)}
        onTouchEnd={() => onHorizontalGestureChange?.(false)}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactFortuneScroll}
          onMomentumScrollEnd={() => onHorizontalGestureChange?.(false)}
          onScrollEndDrag={() => onHorizontalGestureChange?.(false)}
        >
          {values.map((item, index) => {
            const selected = item.id === selectedId;
            const isLeading = Boolean(leading) && index === 0;
            return (
              <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={item.id} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); onSelect(item); }} style={[styles.compactFortuneColumn, isLeading && styles.compactFortuneLeading, selected && styles.compactFortuneSelected]}>
                <Text adjustsFontSizeToFit minimumFontScale={0.68} numberOfLines={1} style={styles.compactFortuneTop}>{item.top}</Text>
                <View style={styles.compactFortuneGlyphRow}><Text style={[styles.compactFortuneGlyph, { color: item.stemText ? palette.text : elementColors[item.pillar.stemElement] }]}>{item.stemText ?? item.pillar.stem}</Text><Text numberOfLines={1} style={styles.compactFortuneGod}>{item.stemGod}</Text></View>
                <View style={styles.compactFortuneGlyphRow}><Text style={[styles.compactFortuneGlyph, { color: item.branchText ? palette.text : elementColors[item.pillar.branchElement] }]}>{item.branchText ?? item.pillar.branch}</Text><Text numberOfLines={1} style={styles.compactFortuneGod}>{item.branchGod}</Text></View>
                <Text numberOfLines={1} style={styles.compactFortuneFooter}>{item.footer ?? " "}</Text>
                <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={3} style={styles.compactFortuneAnnotation}>{item.annotations?.slice(0, 2).join(" · ") ?? item.accent ?? " "}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </DataCard>
  );
}

function toneColor(tone: RelationTone): string {
  if (tone === "generate") return palette.success;
  if (tone === "control") return palette.danger;
  if (tone === "combine") return palette.accent;
  if (tone === "clash") return palette.clash;
  if (tone === "punish") return palette.punish;
  if (tone === "harm") return palette.harm;
  if (tone === "break") return palette.break;
  return palette.muted;
}

function RelationTrack({ mark, count }: { mark: PillarRelationMark; count: number }) {
  const min = Math.min(...mark.memberIndexes);
  const max = Math.max(...mark.memberIndexes);
  const color = toneColor(mark.tone);
  const left = `${((min + 0.5) / count) * 100}%` as `${number}%`;
  const right = `${100 - ((max + 0.5) / count) * 100}%` as `${number}%`;
  const midpoint = `${(((min + max + 1) / 2) / count) * 100}%` as `${number}%`;
  let badge = mark.badge;
  if (mark.direction) badge = mark.direction[0] < mark.direction[1] ? `${mark.badge}→` : `←${mark.badge}`;
  return (
    <View accessibilityLabel={mark.detail} style={styles.relationTrack}>
      <View style={[styles.trackLine, { left, right, backgroundColor: color }]} />
      {mark.memberIndexes.map((index) => (
        <View key={index} style={[styles.trackDot, { left: `${((index + 0.5) / count) * 100}%` as `${number}%`, borderColor: color }]} />
      ))}
      <View style={[styles.trackBadge, { left: midpoint, borderColor: color }]}><Text style={[styles.trackBadgeText, { color }]}>{badge}</Text></View>
    </View>
  );
}

function prioritizedMarks(marks: PillarRelationMark[], plane: "stem" | "branch") {
  return marks
    .filter((mark) => mark.plane === plane)
    .sort((a, b) => {
      const weight = (mark: PillarRelationMark) => mark.memberIndexes.length >= 3 ? 0 : mark.tone === "combine" ? 1 : mark.tone === "clash" ? 2 : mark.tone === "control" ? 3 : 4;
      return weight(a) - weight(b);
    });
}

export function PillarRelationDiagram({
  title,
  pillars,
}: {
  title: string;
  pillars: Pillar[];
}) {
  const marks = useMemo(() => analyzeStructuralRelationMarks(pillars), [pillars]);
  const stemMarks = prioritizedMarks(marks, "stem");
  const branchMarks = prioritizedMarks(marks, "branch");
  const metrics = gridMetrics(pillars.length);
  return (
    <DataCard style={styles.relationCard} contentStyle={styles.relationContent} accessibilityLabel={title}>
      <SectionHeading title={title} />
      <View style={styles.diagramGrid}>
        <View style={{ width: metrics.labelWidth }} />
        <View style={styles.flexColumns}>
          {pillars.map((pillar, index) => <GridCell key={`${pillar.label}-${index}`} height={22} style={styles.equalCell}><Text numberOfLines={1} style={[styles.diagramHeader, { fontSize: metrics.headerSize }]}>{pillarTitle(pillar)}</Text></GridCell>)}
        </View>
      </View>
      {stemMarks.map((mark) => <View key={mark.id} style={styles.diagramGrid}><View style={{ width: metrics.labelWidth }} /><View style={styles.flexColumns}><RelationTrack mark={mark} count={pillars.length} /></View></View>)}
      <View style={styles.diagramGrid}>
        <GridCell height={41} style={{ width: metrics.labelWidth }}><Text style={styles.rowLabel}>天干</Text></GridCell>
        <View style={styles.flexColumns}>{pillars.map((pillar, index) => <GridCell key={`stem-${index}`} height={41} style={styles.equalCell}><Text style={[styles.diagramGlyph, { color: elementColors[pillar.stemElement], fontSize: metrics.glyphSize }]}>{pillar.stem}</Text></GridCell>)}</View>
      </View>
      <View style={styles.diagramGrid}>
        <GridCell height={41} style={{ width: metrics.labelWidth }}><Text style={styles.rowLabel}>地支</Text></GridCell>
        <View style={styles.flexColumns}>{pillars.map((pillar, index) => <GridCell key={`branch-${index}`} height={41} style={styles.equalCell}><Text style={[styles.diagramGlyph, { color: elementColors[pillar.branchElement], fontSize: metrics.glyphSize }]}>{pillar.branch}</Text></GridCell>)}</View>
      </View>
      {branchMarks.map((mark) => <View key={mark.id} style={styles.diagramGrid}><View style={{ width: metrics.labelWidth }} /><View style={styles.flexColumns}><RelationTrack mark={mark} count={pillars.length} /></View></View>)}
      {marks.length === 0 ? (
        <View style={styles.emptyRelations}><Ionicons name="remove-outline" size={18} color={palette.muted} /><Text style={styles.emptyText}>当前柱组未检出基础干支关系</Text></View>
      ) : (
        <View style={styles.relationDetails}>
          {marks.map((mark) => <Text key={`detail-${mark.id}`} style={[styles.relationDetail, { color: toneColor(mark.tone) }]}>• {mark.detail}</Text>)}
        </View>
      )}
    </DataCard>
  );
}

const styles = StyleSheet.create({
  matrixCard: { borderRadius: radii.medium },
  matrixRow: { flexDirection: "row" },
  labelColumn: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: palette.lineStrong },
  flexColumns: { flex: 1, minWidth: 0, flexDirection: "row" },
  equalCell: { flex: 1, minWidth: 0 },
  pillarColumn: { flex: 1, minWidth: 0, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: palette.line },
  pillarColumnSplit: { borderLeftWidth: 1, borderLeftColor: "rgba(71,111,174,0.20)" },
  gridCell: { alignItems: "center", justifyContent: "center", minWidth: 0 },
  bottomBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  rowLabel: { textAlign: "center", fontSize: 9, color: palette.muted, fontWeight: "600" },
  pillarHeader: { color: palette.primary, fontWeight: "800", textAlign: "center" },
  mainGod: { color: palette.text, fontWeight: "700", textAlign: "center", paddingHorizontal: 1 },
  glyph: { fontWeight: "800", textAlign: "center", includeFontPadding: false },
  hiddenStems: { paddingHorizontal: 1, paddingVertical: 4, gap: 1 },
  hiddenStem: { width: "100%", color: palette.text, lineHeight: 14, fontWeight: "600", textAlign: "center" },
  detailCard: { borderRadius: radii.medium },
  detailRow: { minHeight: 31, flexDirection: "row", alignItems: "center" },
  detailRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  detailLabel: { textAlign: "center", fontSize: 9, fontWeight: "700", color: palette.primary },
  detailValueCell: { flex: 1, minWidth: 0, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: palette.line },
  detailValueSplit: { borderLeftWidth: 1, borderLeftColor: "rgba(71,111,174,0.20)" },
  detailValue: { color: palette.text, fontWeight: "600", textAlign: "center", paddingHorizontal: 1 },
  shenShaHeader: { minHeight: 36, paddingHorizontal: 9, paddingVertical: 3, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  shenShaTitle: { color: palette.primary, fontSize: 12, fontWeight: "800" },
  shenShaToggle: { minWidth: 64, height: 30, borderRadius: 15 },
  shenShaItem: { color: palette.text, fontWeight: "700", lineHeight: 13, textAlign: "center", maxWidth: "100%" },
  shenShaCell: { paddingHorizontal: 1, paddingVertical: 8, justifyContent: "flex-start", gap: 3 },
  shenShaEmpty: { color: palette.muted, fontSize: 8 },
  compactFortuneCard: { borderRadius: radii.medium },
  compactFortuneContent: { paddingTop: 2, paddingBottom: 3 },
  compactFortuneHeader: { height: 23, paddingHorizontal: 8, justifyContent: "center" },
  compactFortuneTitle: { color: palette.primary, fontSize: 13, fontWeight: "800" },
  compactFortuneScroll: { paddingHorizontal: 4 },
  compactFortuneColumn: {
    width: 60,
    height: 112,
    paddingHorizontal: 2,
    paddingTop: 1,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: palette.line,
    alignItems: "center",
  },
  compactFortuneSelected: {
    backgroundColor: "rgba(225,236,255,0.56)",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineStrong,
  },
  compactFortuneLeading: { backgroundColor: "transparent" },
  compactFortuneTop: {
    width: "100%",
    height: 18,
    lineHeight: 18,
    color: palette.muted,
    fontSize: 7,
    fontWeight: "700",
    textAlign: "center",
  },
  compactFortuneGlyphRow: {
    height: 24,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  compactFortuneGlyph: { fontSize: 19, lineHeight: 22, fontWeight: "800", includeFontPadding: false },
  compactFortuneGod: { maxWidth: 23, color: palette.text, fontSize: 6.8, fontWeight: "700" },
  compactFortuneFooter: { height: 12, lineHeight: 12, color: palette.muted, fontSize: 7, textAlign: "center" },
  compactFortuneAnnotation: {
    width: "100%",
    minHeight: 22,
    lineHeight: 7,
    color: palette.danger,
    fontSize: 5.8,
    fontWeight: "700",
    textAlign: "center",
  },
  relationCard: { borderRadius: radii.medium },
  relationContent: { padding: 10, gap: 3 },
  diagramGrid: { flexDirection: "row", minHeight: 0 },
  diagramHeader: { color: palette.primary, fontWeight: "700", textAlign: "center" },
  diagramGlyph: { width: "100%", textAlign: "center", fontWeight: "800", includeFontPadding: false },
  relationTrack: { flex: 1, height: 20, position: "relative", justifyContent: "center" },
  trackLine: { position: "absolute", top: 10, height: StyleSheet.hairlineWidth },
  trackDot: { position: "absolute", top: 7, marginLeft: -3, width: 7, height: 7, borderRadius: 4, borderWidth: 1.2, backgroundColor: palette.surfaceStrong },
  trackBadge: { position: "absolute", top: 2, marginLeft: -15, minWidth: 30, height: 17, paddingHorizontal: 3, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, backgroundColor: palette.surfaceStrong, alignItems: "center", justifyContent: "center" },
  trackBadgeText: { fontSize: 7, fontWeight: "900" },
  relationDetails: { marginTop: 4, paddingTop: 6, paddingHorizontal: 3, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, gap: 2 },
  relationDetail: { fontSize: 8, fontWeight: "600" },
  emptyRelations: { flexDirection: "row", gap: 4, alignItems: "center", justifyContent: "center", paddingVertical: 18 },
  emptyText: { fontSize: 10, color: palette.muted },
});
