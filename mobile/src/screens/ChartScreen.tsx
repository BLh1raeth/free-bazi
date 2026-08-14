import { Ionicons } from "@expo/vector-icons";
import { Temporal } from "@js-temporal/polyfill";
import { useMemo, useRef, useState } from "react";
import { LayoutAnimation, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from "react-native";
import {
  findLuckPillar,
  generateMinorLuckFlowYears,
  generateFlowDays,
  generateFlowHours,
  generateFlowMonths,
  generateFlowYearsForLuck,
  flowYearAnnotations,
  type BaziChart,
  type FlowDay,
  type FlowHour,
  type FlowMonth,
  type FlowYear,
  type Pillar,
} from "../../../src/lib/bazi";
import {
  NatalDetails,
  PillarMatrix,
  PillarRelationDiagram,
  ShenShaMatrix,
  CompactFortuneTable,
  type FortuneColumn,
} from "../components/pillars";
import {
  ContentTransition,
  DataCard,
  IconGlassButton,
  ScreenHeader,
  Segmented,
  ToggleChip,
  GlassSurface,
  LiquidPressable,
} from "../components/ui";
import { palette, radii } from "../theme";

type ChartMode = "natal" | "detail" | "flow";
type OptionalLayer = "month" | "day" | "hour";
type RelationScope = "natal" | "luck" | "year";
const MODE_ORDER: ChartMode[] = ["natal", "detail", "flow"];

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function animateLayoutChange() {
  LayoutAnimation.configureNext({
    duration: 230,
    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  });
}

function natalPillars(chart: BaziChart): Pillar[] {
  return chart.pillars.filter((pillar): pillar is Pillar => pillar !== null);
}

function displayName(chart: BaziChart): string {
  return chart.input.name?.trim() || "未命名命盘";
}

function todayIso(timezone: string): string {
  return Temporal.Now.zonedDateTimeISO(timezone).toPlainDate().toString();
}

function flowYearRange(chart: BaziChart, natal: Pillar[], currentYear: number, selectedLuckIndex?: number, minorLuck = false): FlowYear[] {
  if (minorLuck && chart.luckCycle) {
    return generateMinorLuckFlowYears({
      birthYear: chart.input.year,
      birthMonth: chart.input.month,
      birthDay: chart.input.day,
      dayMaster: chart.dayMaster,
      natalPillars: natal,
      luckCycle: chart.luckCycle,
    });
  }
  const selectedLuck = chart.luckCycle?.items.find((item) => item.index === selectedLuckIndex) ?? null;
  return generateFlowYearsForLuck({
    fallbackYear: currentYear,
    selectedLuck,
    birthYear: chart.input.year,
    birthMonth: chart.input.month,
    birthDay: chart.input.day,
    dayMaster: chart.dayMaster,
    natalPillars: natal,
    luckCycle: chart.luckCycle,
  });
}

function LuckSummary({ chart }: { chart: BaziChart }) {
  if (!chart.luckCycle) {
    return (
      <DataCard contentStyle={styles.luckSummary} accessibilityLabel="起运与交运信息">
        <View>
          <Text style={styles.luckSummaryTitle}>起运与交运</Text>
          <Text style={styles.luckSummaryText}>四柱直排未提供唯一出生日期，暂不生成大运。</Text>
        </View>
      </DataCard>
    );
  }
  const { startAge, startDate, forward } = chart.luckCycle;
  return (
    <DataCard contentStyle={styles.luckSummary} accessibilityLabel="起运与交运信息">
      <View>
        <Text style={styles.luckSummaryTitle}>起运与交运</Text>
        <Text style={styles.luckSummaryText}>起运：出生后 {startAge.years}年{startAge.months}月{startAge.days}日</Text>
      </View>
      <View style={styles.luckSummaryRight}>
        <Text style={styles.luckSummaryYear}>{startDate}</Text>
        <Text style={styles.luckSummaryText}>{forward ? "顺排" : "逆排"} · 每十年换运</Text>
      </View>
    </DataCard>
  );
}

export function ChartScreen({
  chart,
  onEditInput,
  onOpenSettings,
  onBackToArchive,
  note,
}: {
  chart: BaziChart;
  onEditInput: () => void;
  onOpenSettings: () => void;
  onBackToArchive: () => void;
  note?: string;
}) {
  const natal = useMemo(() => natalPillars(chart), [chart]);
  const currentYear = Temporal.Now.zonedDateTimeISO(chart.calendar.timezone).year;
  const initialLuck =
    findLuckPillar(chart.luckCycle, currentYear) ??
    chart.luckCycle?.items[0]?.pillar ??
    null;
  const initialLuckIndex = chart.luckCycle?.items.find((item) => item.pillar.ganZhi === initialLuck?.ganZhi)?.index;
  const initialFlowYears = flowYearRange(chart, natal, currentYear, initialLuckIndex);
  const initialYear = initialFlowYears.find((item) => item.year === currentYear) ?? initialFlowYears[0]!;

  const [mode, setMode] = useState<ChartMode>("detail");
  const [selectedYear, setSelectedYear] = useState<FlowYear>(initialYear);
  const [selectedLuck, setSelectedLuck] = useState<Pillar | null>(initialLuck);
  const [minorLuckSelected, setMinorLuckSelected] = useState(false);
  const transitListGestureActive = useRef(false);
  const [selectedMonth, setSelectedMonth] = useState<FlowMonth | null>(null);
  const [selectedDay, setSelectedDay] = useState<FlowDay | null>(null);
  const [selectedHour, setSelectedHour] = useState<FlowHour | null>(null);
  const [layers, setLayers] = useState<Record<OptionalLayer, boolean>>({
    month: false,
    day: false,
    hour: false,
  });
  const [relationScope, setRelationScope] = useState<RelationScope>("luck");

  const selectedLuckItem = useMemo(
    () => chart.luckCycle?.items.find((item) => item.pillar.ganZhi === selectedLuck?.ganZhi) ?? null,
    [chart.luckCycle, selectedLuck],
  );
  const flowYears = useMemo(() => {
    return flowYearRange(chart, natal, currentYear, selectedLuckItem?.index, minorLuckSelected);
  }, [chart, currentYear, minorLuckSelected, natal, selectedLuckItem]);

  const months = useMemo(() => {
    return generateFlowMonths({
      year: selectedYear.year,
      timezone: chart.calendar.timezone,
      dayMaster: chart.dayMaster,
      luckCycle: chart.luckCycle,
      contexts: [
        ...natal,
        ...(selectedLuck ? [selectedLuck] : []),
        selectedYear.pillar,
      ],
    });
  }, [chart.calendar.timezone, chart.dayMaster, natal, selectedLuck, selectedYear]);

  const activeMonth = selectedMonth ?? months[0] ?? null;
  const days = useMemo(() => {
    if (!activeMonth) return [];
    return generateFlowDays({
      month: activeMonth,
      timezone: chart.calendar.timezone,
      dayMaster: chart.dayMaster,
      dayBoundaryRule: chart.input.dayBoundaryRule,
      contexts: [
        ...natal,
        ...(selectedLuck ? [selectedLuck] : []),
        selectedYear.pillar,
        activeMonth.pillar,
      ],
    });
  }, [activeMonth, chart, natal, selectedLuck, selectedYear]);

  const activeDay =
    selectedDay ??
    days.find((day) => day.date === todayIso(chart.calendar.timezone)) ??
    days[0] ??
    null;
  const hours = useMemo(() => {
    if (!activeDay) return [];
    return generateFlowHours({
      date: activeDay.date,
      dayMaster: chart.dayMaster,
      dayBoundaryRule: chart.input.dayBoundaryRule,
      contexts: [
        ...natal,
        ...(selectedLuck ? [selectedLuck] : []),
        selectedYear.pillar,
        ...(activeMonth ? [activeMonth.pillar] : []),
        activeDay.pillar,
      ],
    });
  }, [activeDay, activeMonth, chart, natal, selectedLuck, selectedYear]);
  const activeHour = selectedHour ?? hours[0] ?? null;

  const displayedPillars = useMemo(
    () => [
      ...(selectedLuck ? [selectedLuck] : []),
      selectedYear.pillar,
      ...(layers.month && activeMonth ? [activeMonth.pillar] : []),
      ...(layers.day && activeDay ? [activeDay.pillar] : []),
      ...(layers.hour && activeHour ? [activeHour.pillar] : []),
      ...natal,
    ],
    [activeDay, activeHour, activeMonth, layers, natal, selectedLuck, selectedYear],
  );

  const toggleLayer = (layer: OptionalLayer) => {
    animateLayoutChange();
    setLayers((current) => {
      if (layer === "month") {
        const next = !current.month;
        return { month: next, day: next && current.day, hour: next && current.hour };
      }
      if (layer === "day") {
        const next = !current.day;
        return { month: next || current.month, day: next, hour: next && current.hour };
      }
      const next = !current.hour;
      return { month: next || current.month, day: next || current.day, hour: next };
    });
  };

  const pageSwipeGesture = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, state) => !transitListGestureActive.current && Math.abs(state.dx) > 18 && Math.abs(state.dx) > Math.abs(state.dy) * 1.45,
    onPanResponderRelease: (_, state) => {
      if (Math.abs(state.dx) < 48) return;
      const index = MODE_ORDER.indexOf(mode);
      const nextIndex = state.dx < 0 ? Math.min(MODE_ORDER.length - 1, index + 1) : Math.max(0, index - 1);
      if (nextIndex !== index) {
        animateLayoutChange();
        setMode(MODE_ORDER[nextIndex]!);
      }
    },
  }), [mode]);

  const leftEdgeGesture = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_, state) => {
      if (state.dx > 42 && Math.abs(state.dx) > Math.abs(state.dy) * 1.1) onBackToArchive();
    },
  }), [onBackToArchive]);

  const rightEdgeGesture = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_, state) => {
      if (state.dx < -42 && Math.abs(state.dx) > Math.abs(state.dy) * 1.1) onBackToArchive();
    },
  }), [onBackToArchive]);

  return (
    <View style={styles.fill} {...pageSwipeGesture.panHandlers}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="命盘"
          leading={<IconGlassButton icon="chevron-back" label="返回档案库" onPress={onBackToArchive} />}
          action={
            <LiquidPressable accessibilityLabel="修改备注和出生时间" onPress={onEditInput}>
              <GlassSurface interactive glassStyle="regular" tintColor="rgba(205,225,255,0.58)" fallbackColor="rgba(222,236,255,0.90)" style={styles.editButton}><Text style={styles.editButtonText}>修改</Text></GlassSurface>
            </LiquidPressable>
          }
        />
        <IdentityCard chart={chart} note={note} />
        <Segmented
          label="命盘模式"
          value={mode}
          options={[
            { value: "natal", label: "原盘" },
            { value: "detail", label: "细盘" },
            { value: "flow", label: "流通" },
          ]}
          onChange={(nextMode) => {
            animateLayoutChange();
            setMode(nextMode);
          }}
        />

        <ContentTransition key={`${mode}-${relationScope}`} transitionKey={`${mode}-${relationScope}`}>
          {mode === "natal" ? (
            <NatalMode chart={chart} natal={natal} />
          ) : mode === "detail" ? (
            <DetailMode
              activeDay={activeDay}
              activeHour={activeHour}
              activeMonth={activeMonth}
              chart={chart}
              days={days}
              displayedPillars={displayedPillars}
              flowYears={flowYears}
              hours={hours}
              layers={layers}
              months={months}
              onLayerToggle={toggleLayer}
              onHorizontalGestureChange={(active) => { transitListGestureActive.current = active; }}
              onLuckSelect={(pillar) => {
                const item = chart.luckCycle?.items.find((candidate) => candidate.pillar.ganZhi === pillar.ganZhi);
                const nextYears = flowYearRange(chart, natal, currentYear, item?.index);
                setSelectedLuck(pillar);
                setMinorLuckSelected(false);
                setSelectedYear(nextYears.find((year) => year.year === currentYear) ?? nextYears[0] ?? selectedYear);
                setSelectedMonth(null);
                setSelectedDay(null);
                setSelectedHour(null);
              }}
              onYearSelect={(year) => {
                setSelectedYear(year);
                if (minorLuckSelected) {
                  const minor = chart.luckCycle?.minorLuck.find((item) => item.year === year.year);
                  if (minor) setSelectedLuck(minor.pillar);
                }
                setSelectedMonth(null);
                setSelectedDay(null);
                setSelectedHour(null);
              }}
              selectedLuck={selectedLuck}
              minorLuckSelected={minorLuckSelected}
              onMinorLuckSelect={() => {
                const nextYears = flowYearRange(chart, natal, currentYear, undefined, true);
                if (nextYears.length === 0) return;
                setMinorLuckSelected(true);
                setSelectedLuck(chart.luckCycle?.minorLuck[0]?.pillar ?? null);
                setSelectedYear(nextYears[0]!);
                setSelectedMonth(null);
                setSelectedDay(null);
                setSelectedHour(null);
              }}
              selectedYear={selectedYear}
              setSelectedDay={setSelectedDay}
              setSelectedHour={setSelectedHour}
              setSelectedMonth={(month) => {
                setSelectedMonth(month);
                setSelectedDay(null);
                setSelectedHour(null);
              }}
            />
          ) : (
            <FlowMode
              natal={natal}
              relationScope={relationScope}
              selectedLuck={selectedLuck}
              selectedYear={selectedYear}
              setRelationScope={(nextScope) => {
                animateLayoutChange();
                setRelationScope(nextScope);
              }}
            />
          )}
        </ContentTransition>
      </ScrollView>
      <View style={[styles.edgeGestureZone, styles.edgeGestureLeft]} {...leftEdgeGesture.panHandlers} />
      <View style={[styles.edgeGestureZone, styles.edgeGestureRight]} {...rightEdgeGesture.panHandlers} />
    </View>
  );
}

function IdentityCard({
  chart,
  note,
}: {
  chart: BaziChart;
  note?: string;
}) {
  const gender =
    chart.input.gender === "male"
      ? "男"
      : chart.input.gender === "female"
        ? "女"
        : "未指定";
  const directMode = chart.input.calendarType === "pillars";
  return (
    <DataCard style={styles.identityCard} contentStyle={styles.identityContent}>
      <View style={styles.avatar}>
        <Ionicons name="person-outline" size={27} color={palette.accent} />
      </View>
      <View style={styles.identityName}>
        <Text numberOfLines={1} style={styles.identityTitle}>
          {displayName(chart)}
        </Text>
        <Text style={styles.identityMeta}>{gender}</Text>
      </View>
      <View style={styles.identityDivider} />
      <View style={styles.identityDetails}>
        <View style={styles.identityInfoRow}>
          <Text style={styles.identityLabel}>{directMode ? "四柱" : "公历"}</Text>
          <Text numberOfLines={1} style={styles.identityLine}>
            {directMode ? chart.input.directPillars ? Object.values(chart.input.directPillars).join(" ") : "—" : chart.calendar.solarText.replace(/^公历\s*/, "")}
          </Text>
        </View>
        <View style={styles.identityInfoRow}>
          <Text style={styles.identityLabel}>{directMode ? "历法" : "农历"}</Text>
          <Text numberOfLines={1} style={styles.identityLine}>
            {directMode ? "直排，不反推日期" : chart.calendar.lunarText.replace(/^农历/, "")}
          </Text>
        </View>
        <View style={styles.identityInfoRow}>
          <Text style={styles.identityLabel}>出生地</Text>
          <Text numberOfLines={1} style={styles.identityLine}>{chart.calendar.location.city}</Text>
        </View>
        {note ? <View style={styles.identityInfoRow}><Text style={styles.identityLabel}>备注</Text><Text numberOfLines={1} style={styles.identityLine}>{note}</Text></View> : null}
      </View>
      <View style={styles.locationIcon}>
        <Ionicons name="location-outline" size={16} color={palette.accent} />
      </View>
    </DataCard>
  );
}

function NatalMode({ chart, natal }: { chart: BaziChart; natal: Pillar[] }) {
  return (
    <View style={styles.modeContent}>
      <PillarMatrix pillars={natal} accessibilityLabel="原局四柱" showHiddenStems />
      <NatalDetails chart={chart} pillars={natal} />
      <ShenShaMatrix chart={chart} pillars={natal} />
      <PillarRelationDiagram title="原局干支关系" pillars={natal} />
    </View>
  );
}

function DetailMode({
  chart,
  layers,
  onLayerToggle,
  onHorizontalGestureChange,
  displayedPillars,
  selectedLuck,
  minorLuckSelected,
  onMinorLuckSelect,
  onLuckSelect,
  flowYears,
  selectedYear,
  onYearSelect,
  months,
  activeMonth,
  setSelectedMonth,
  days,
  activeDay,
  setSelectedDay,
  hours,
  activeHour,
  setSelectedHour,
}: {
  chart: BaziChart;
  layers: Record<OptionalLayer, boolean>;
  onLayerToggle: (layer: OptionalLayer) => void;
  onHorizontalGestureChange: (active: boolean) => void;
  displayedPillars: Pillar[];
  selectedLuck: Pillar | null;
  minorLuckSelected: boolean;
  onMinorLuckSelect: () => void;
  onLuckSelect: (pillar: Pillar) => void;
  flowYears: FlowYear[];
  selectedYear: FlowYear;
  onYearSelect: (year: FlowYear) => void;
  months: FlowMonth[];
  activeMonth: FlowMonth | null;
  setSelectedMonth: (month: FlowMonth) => void;
  days: FlowDay[];
  activeDay: FlowDay | null;
  setSelectedDay: (day: FlowDay) => void;
  hours: FlowHour[];
  activeHour: FlowHour | null;
  setSelectedHour: (hour: FlowHour) => void;
}) {
  const luckItems: FortuneColumn[] =
    chart.luckCycle?.items.map((item) => ({
      id: `luck-${item.index}`,
      top: String(item.startYear),
      pillar: item.pillar,
      stemGod: item.pillar.tenGod,
      branchGod: item.pillar.hiddenStems[0]?.tenGod ?? "",
      footer: `${item.startAge}岁`,
      accent: item.isCurrent ? "当前" : undefined,
    })) ?? [];
  const minorLuckItems: FortuneColumn[] = chart.luckCycle?.minorLuck.map((item) => ({
    id: `minor-${item.year}`,
    top: String(item.year),
    pillar: item.pillar,
    stemGod: item.pillar.tenGod,
    branchGod: item.pillar.hiddenStems[0]?.tenGod ?? "",
    footer: `${item.age}岁`,
  })) ?? [];
  const yearItems: FortuneColumn[] = flowYears.map((item) => ({
    id: `year-${item.year}`,
    top: String(item.year),
    pillar: item.pillar,
    stemGod: item.pillar.tenGod,
    branchGod: item.pillar.hiddenStems[0]?.tenGod ?? "",
    footer: chart.input.calendarType === "pillars" ? undefined : `${item.nominalAge}岁`,
    annotations: flowYearAnnotations(item, chart, selectedLuck),
  }));

  return (
    <View style={styles.modeContent}>
      <View style={styles.layerRow}>
        <Text style={styles.layerTitle}>显示时运</Text>
        <View style={styles.layerChips}>
          <ToggleChip label="流月" active={layers.month} onPress={() => onLayerToggle("month")} />
          <ToggleChip label="流日" active={layers.day} onPress={() => onLayerToggle("day")} />
          <ToggleChip label="流时" active={layers.hour} onPress={() => onLayerToggle("hour")} />
        </View>
      </View>
      <PillarMatrix pillars={displayedPillars} accessibilityLabel="时运与原局命盘" showHiddenStems splitAfter={Math.max(0, displayedPillars.length - 4)} />
      <NatalDetails chart={chart} pillars={displayedPillars} splitAfter={Math.max(0, displayedPillars.length - 4)} />
      <ShenShaMatrix chart={chart} pillars={displayedPillars} splitAfter={Math.max(0, displayedPillars.length - 4)} />
      <PillarRelationDiagram title="原局干支关系" pillars={chart.pillars.filter((pillar): pillar is Pillar => pillar !== null)} />
      <LuckSummary chart={chart} />
      <CompactFortuneTable
        title="大运"
        leading={minorLuckItems.length ? {
          id: "minor-summary",
          top: String(minorLuckItems[0]?.top ?? "小运"),
          pillar: minorLuckItems.at(-1)?.pillar ?? chart.luckCycle!.items[0]!.pillar,
          stemGod: "",
          branchGod: "",
          footer: minorLuckItems.length ? `${minorLuckItems[0]?.footer?.replace("岁", "")}–${minorLuckItems.at(-1)?.footer}` : "",
          stemText: "小",
          branchText: "运",
        } : undefined}
        columns={luckItems}
        selectedId={minorLuckSelected ? "minor-summary" : luckItems.find((item) => item.pillar.ganZhi === selectedLuck?.ganZhi)?.id}
        onSelect={(item) => { if (item.id === "minor-summary") onMinorLuckSelect(); else onLuckSelect(item.pillar); }}
        onHorizontalGestureChange={onHorizontalGestureChange}
      />
      <CompactFortuneTable
        title="流年"
        columns={yearItems}
        selectedId={`year-${selectedYear.year}`}
        onSelect={(item) => {
          const year = flowYears.find((entry) => `year-${entry.year}` === item.id);
          if (year) onYearSelect(year);
        }}
        onHorizontalGestureChange={onHorizontalGestureChange}
      />
      <CompactFortuneTable
          title="流月"
          columns={months.map((month) => ({
            id: month.id,
            top: `${month.startLocal.slice(5, 10)}–${month.endLocal.slice(5, 10)}`,
            pillar: month.pillar,
            stemGod: month.pillar.tenGod,
            branchGod: month.pillar.hiddenStems[0]?.tenGod ?? "",
            footer: `${month.startTerm}–${month.endTerm}`,
            annotations: month.luckHandoffs,
          }))}
          selectedId={activeMonth?.id}
          onSelect={(item) => {
            const month = months.find((entry) => entry.id === item.id);
            if (month) setSelectedMonth(month);
          }}
          onHorizontalGestureChange={onHorizontalGestureChange}
      />
      <CompactFortuneTable
          title="流日"
          columns={days.map((day) => ({ id: day.date, top: day.date.slice(5), pillar: day.pillar, stemGod: day.pillar.tenGod, branchGod: day.pillar.hiddenStems[0]?.tenGod ?? "", footer: day.weekText }))}
          selectedId={activeDay?.date}
          onSelect={(item) => {
            const day = days.find((entry) => entry.date === item.id);
            if (day) setSelectedDay(day);
          }}
          onHorizontalGestureChange={onHorizontalGestureChange}
      />
      <CompactFortuneTable
          title="流时"
          columns={hours.map((hour) => ({
            id: `hour-${hour.index}`,
            top: hour.timeRange.replace("（跨日）", ""),
            pillar: hour.pillar,
            stemGod: hour.pillar.tenGod,
            branchGod: hour.pillar.hiddenStems[0]?.tenGod ?? "",
          }))}
          selectedId={activeHour ? `hour-${activeHour.index}` : undefined}
          onSelect={(item) => {
            const hour = hours.find((entry) => `hour-${entry.index}` === item.id);
            if (hour) setSelectedHour(hour);
          }}
          onHorizontalGestureChange={onHorizontalGestureChange}
      />
    </View>
  );
}

function FlowMode({
  natal,
  selectedLuck,
  selectedYear,
  relationScope,
  setRelationScope,
}: {
  natal: Pillar[];
  selectedLuck: Pillar | null;
  selectedYear: FlowYear;
  relationScope: RelationScope;
  setRelationScope: (scope: RelationScope) => void;
}) {
  const pillars = [
    ...(relationScope === "year" ? [selectedYear.pillar] : []),
    ...(relationScope !== "natal" && selectedLuck ? [selectedLuck] : []),
    ...natal,
  ];
  const title = relationScope === "natal" ? "原局关系" : relationScope === "luck" ? "原局与大运" : "原局、大运与流年";
  return (
    <View style={styles.modeContent}>
      <View style={styles.scopeRow}>
        <ToggleChip label="原局" active={relationScope === "natal"} onPress={() => setRelationScope("natal")} />
        <ToggleChip label="+ 大运" active={relationScope === "luck"} onPress={() => setRelationScope("luck")} />
        <ToggleChip label="+ 流年" active={relationScope === "year"} onPress={() => setRelationScope("year")} />
      </View>
      <PillarRelationDiagram title={title} pillars={pillars} />
      <DataCard contentStyle={styles.legendContent}>
        <View style={[styles.legendDot, { backgroundColor: palette.accent }]} />
        <Text style={styles.legendText}>合会</Text>
        <View style={[styles.legendDot, { backgroundColor: palette.clash }]} />
        <Text style={styles.legendText}>冲</Text>
        <View style={[styles.legendDot, { backgroundColor: palette.punish }]} />
        <Text style={styles.legendText}>刑</Text>
        <View style={[styles.legendDot, { backgroundColor: palette.harm }]} />
        <Text style={styles.legendText}>害</Text>
        <View style={[styles.legendDot, { backgroundColor: palette.break }]} />
        <Text style={styles.legendText}>破</Text>
        <Text style={styles.legendNote}>仅列规则关系，不输出吉凶判断</Text>
      </DataCard>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  edgeGestureZone: { position: "absolute", top: 0, bottom: 0, width: 12, zIndex: 30 },
  edgeGestureLeft: { left: 0 },
  edgeGestureRight: { right: 0 },
  content: { paddingHorizontal: 14, paddingBottom: 104, gap: 8 },
  headerActions: { flexDirection: "row", gap: 5 },
  editButton: { minWidth: 54, height: 34, borderRadius: 17 },
  editButtonText: { color: palette.accent, fontSize: 12, fontWeight: "800" },
  identityCard: { borderRadius: radii.medium, height: 92 },
  identityContent: { flex: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineStrong,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  identityName: { width: 66, gap: 3 },
  identityTitle: { color: palette.text, fontSize: 13, fontWeight: "800" },
  identityMeta: { color: palette.text, fontSize: 10 },
  identityDivider: { width: StyleSheet.hairlineWidth, height: 60, backgroundColor: palette.lineStrong },
  identityDetails: { flex: 1, gap: 4 },
  identityInfoRow: { flexDirection: "row", gap: 7 },
  identityLabel: { width: 33, color: palette.primary, fontSize: 9, fontWeight: "700" },
  identityLine: { flex: 1, color: palette.text, fontSize: 10 },
  locationIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineStrong,
    backgroundColor: palette.surfaceStrong,
  },
  modeContent: { gap: 8 },
  layerRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 8 },
  layerTitle: { fontSize: 11, fontWeight: "800", color: palette.primary },
  layerChips: { flexDirection: "row", gap: 5 },
  scopeRow: { flexDirection: "row", justifyContent: "center", gap: 7 },
  legendContent: { minHeight: 42, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: palette.text, fontSize: 9 },
  legendNote: { width: "100%", color: palette.muted, fontSize: 8, textAlign: "right" },
  luckSummary: { minHeight: 64, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  luckSummaryTitle: { color: palette.primary, fontSize: 13, fontWeight: "800", marginBottom: 4 },
  luckSummaryText: { color: palette.muted, fontSize: 9 },
  luckSummaryRight: { alignItems: "flex-end", gap: 4 },
  luckSummaryYear: { color: palette.accent, fontSize: 11, fontWeight: "800" },
  pressed: { transform: [{ scale: 0.96 }] },
});
