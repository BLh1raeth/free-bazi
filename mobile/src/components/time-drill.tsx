import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import type { FlowDay, FlowHour, FlowMonth, FlowYear, Pillar } from "../../../src/lib/bazi";
import { elementColors, palette, radii } from "../theme";
import type { FortuneColumn } from "./pillars";

type Level = 0 | 1 | 2 | 3 | 4;

const WHEEL_ITEM_HEIGHT = 44;
const STEP_RADIANS = (Math.PI / 180) * 15;

function useFade(initial = 0): [Animated.Value, (toValue: number, duration?: number) => void] {
  const value = useRef(new Animated.Value(initial)).current;
  const set = useCallback((toValue: number, duration = 240) => {
    Animated.timing(value, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start();
  }, [value]);
  return [value, set];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function monthLabel(month: FlowMonth): string {
  return month.name || month.pillar.branch;
}

export function TimeDrill({
  luckColumns,
  flowYears,
  months,
  days,
  hours,
  selectedLuck,
  selectedYear,
  selectedMonth,
  selectedDay,
  onSelectLuck,
  onSelectYear,
  onSelectMonth,
  onSelectDay,
  onSelectHour,
}: {
  luckColumns: FortuneColumn[];
  flowYears: FlowYear[];
  months: FlowMonth[];
  days: FlowDay[];
  hours: FlowHour[];
  selectedLuck: Pillar | null;
  selectedYear: FlowYear;
  selectedMonth: FlowMonth | null;
  selectedDay: FlowDay | null;
  onSelectLuck: (pillar: Pillar) => void;
  onSelectYear: (year: FlowYear) => void;
  onSelectMonth: (month: FlowMonth) => void;
  onSelectDay: (day: FlowDay) => void;
  onSelectHour: (hour: FlowHour) => void;
}) {
  const [level, setLevel] = useState<Level>(0);
  const [canvas, setCanvas] = useState({ width: 390, height: 340 });
  const [luckFade, showLuck] = useFade(1);
  const luckTranslate = useRef(new Animated.Value(0)).current;
  const [yearFade, showYear] = useFade();
  const [monthFade, showMonth] = useFade();
  const [dayFade, showDay] = useFade();
  const [hourFade, showHour] = useFade();

  const selectedLuckItem = selectedLuck
    ? luckColumns.find((item) => item.pillar.ganZhi === selectedLuck.ganZhi)
    : undefined;
  const selectedYearIndex = Math.max(0, flowYears.findIndex((year) => year.year === selectedYear.year));

  const go = useCallback((next: Level) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLevel(next);
    showLuck(next === 0 ? 1 : next === 1 ? 0.5 : 0.2, next > 0 ? 380 : 260);
    showYear(next === 1 ? 1 : next === 2 ? 0.45 : 0.2, next === 1 ? 420 : 300);
    showMonth(next === 2 ? 1 : next === 3 ? 0.45 : 0.2, next === 2 ? 420 : 300);
    showDay(next === 3 ? 1 : next === 4 ? 0.45 : 0, next === 3 ? 420 : 300);
    showHour(next === 4 ? 1 : 0, next === 4 ? 420 : 300);
    Animated.timing(luckTranslate, {
      toValue: next === 0 ? 0 : -(canvas.width * 0.26),
      duration: next > 0 ? 420 : 300,
      useNativeDriver: true,
    }).start();
  }, [canvas.width, luckTranslate, showDay, showHour, showLuck, showMonth, showYear]);

  const anchorX = canvas.width / 2;
  const anchorY = canvas.height / 2;

  const selectLuckItem = (item: FortuneColumn) => {
    void Haptics.selectionAsync();
    onSelectLuck(item.pillar);
    go(1);
  };
  const selectYearItem = (year: FlowYear) => {
    void Haptics.selectionAsync();
    onSelectYear(year);
    go(2);
  };
  const selectMonthItem = (month: FlowMonth) => {
    void Haptics.selectionAsync();
    onSelectMonth(month);
    go(3);
  };
  const selectDayItem = (day: FlowDay) => {
    void Haptics.selectionAsync();
    onSelectDay(day);
    go(4);
  };

  const activeDay = selectedDay ?? days[0] ?? null;
  const breadcrumb: Array<{ key: string; label: string; target: Level }> = [];
  if (level >= 1 && selectedLuckItem) breadcrumb.push({ key: "luck", label: selectedLuckItem.pillar.ganZhi, target: 1 });
  if (level >= 2) breadcrumb.push({ key: "year", label: String(selectedYear.year), target: 2 });
  if (level >= 3 && selectedMonth) breadcrumb.push({ key: "month", label: monthLabel(selectedMonth), target: 3 });
  if (level >= 4 && activeDay) breadcrumb.push({ key: "day", label: activeDay.date.slice(5), target: 4 });

  return (
    <View style={styles.container}>
      {level >= 1 ? (
        <View style={styles.breadcrumbRow}>
          {breadcrumb.map((item, index) => (
            <View key={item.key} style={styles.breadcrumbItem}>
              {index > 0 ? <Text style={styles.breadcrumbSep}>·</Text> : null}
              <Pressable onPress={() => go(item.target)}>
                <Text style={[styles.breadcrumbText, index === breadcrumb.length - 1 && styles.breadcrumbActive]}>{item.label}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View
        style={styles.canvas}
        onLayout={(event: LayoutChangeEvent) => {
          const { width, height } = event.nativeEvent.layout;
          setCanvas({ width, height });
        }}
      >
        <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { opacity: luckFade, zIndex: 1, transform: [{ translateX: luckTranslate }] }]}>
          <LuckAxis
            columns={luckColumns}
            selectedGanZhi={selectedLuck?.ganZhi ?? null}
            compact={level >= 1}
            onSelect={selectLuckItem}
          />
        </Animated.View>

        {level >= 1 ? (
          <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { opacity: yearFade, zIndex: 2 }]}>
            <YearAxis
              canvas={canvas}
              years={flowYears}
              selectedIndex={selectedYearIndex}
              anchorX={anchorX}
              anchorY={anchorY}
              onSelect={selectYearItem}
            />
          </Animated.View>
        ) : null}

        {level >= 2 ? (
          <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { opacity: monthFade, zIndex: 3 }]}>
            <MonthWheel
              canvas={canvas}
              months={months}
              selectedMonth={selectedMonth}
              anchorX={anchorX}
              anchorY={anchorY}
              onSelect={selectMonthItem}
            />
          </Animated.View>
        ) : null}

        {level >= 3 ? (
          <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { opacity: dayFade, zIndex: 4 }]}>
            <DayFan
              canvas={canvas}
              days={days}
              selectedDay={selectedDay}
              anchorX={anchorX}
              anchorY={anchorY}
              onSelect={selectDayItem}
            />
          </Animated.View>
        ) : null}

        {level >= 4 ? (
          <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { opacity: hourFade, zIndex: 5 }]}>
            <HourRing
              canvas={canvas}
              hours={hours}
              anchorX={anchorX}
              anchorY={anchorY}
              onSelect={onSelectHour}
            />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function LuckAxis({
  columns,
  selectedGanZhi,
  compact,
  onSelect,
}: {
  columns: FortuneColumn[];
  selectedGanZhi: string | null;
  compact: boolean;
  onSelect: (item: FortuneColumn) => void;
}) {
  return (
    <View style={styles.luckAxisWrap}>
      <View pointerEvents="none" style={styles.luckLine} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.luckAxisContent}>
        {columns.map((item) => {
          const active = item.pillar.ganZhi === selectedGanZhi;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={item.id}
              onPress={() => onSelect(item)}
              style={styles.luckRow}
            >
              <View style={[styles.luckDot, active && styles.luckDotActive]} />
              <View style={styles.luckCopy}>
                <Text style={[styles.luckGanZhi, active && styles.luckGanZhiActive, compact && !active && styles.dimmed]}>{item.pillar.ganZhi}</Text>
                <Text style={[styles.luckMeta, compact && !active && styles.dimmed]}>{item.footer ?? ""}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function YearAxis({
  canvas,
  years,
  selectedIndex,
  anchorX,
  anchorY,
  onSelect,
}: {
  canvas: { width: number; height: number };
  years: FlowYear[];
  selectedIndex: number;
  anchorX: number;
  anchorY: number;
  onSelect: (year: FlowYear) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const itemWidth = 64;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) {
      const offset = Math.max(0, selectedIndex * itemWidth - (canvas.width - itemWidth) / 2);
      scrollRef.current?.scrollTo({ x: offset, animated: true });
    }
  }, [canvas.width, ready, selectedIndex]);

  const window = useMemo(() => {
    const start = Math.max(0, selectedIndex - 4);
    const end = Math.min(years.length - 1, selectedIndex + 4);
    return years.slice(start, end + 1);
  }, [selectedIndex, years]);

  return (
    <View style={[styles.yearAxisWrap, { top: anchorY - 26 }]}>
      <View pointerEvents="none" style={[styles.yearLine, { left: 0, right: 0 }]} />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.yearAxisContent}
        onContentSizeChange={() => {
          if (!ready) {
            setReady(true);
          }
        }}
      >
        {window.map((year, index) => {
          const active = year.year === years[selectedIndex]?.year;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={year.year}
              onPress={() => onSelect(year)}
              style={[styles.yearNode, { width: itemWidth }]}
            >
              <View style={[styles.yearDot, active && styles.yearDotActive]} />
              <Text style={[styles.yearText, active && styles.yearTextActive]}>{year.year}</Text>
              <Text style={[styles.yearGanZhi, active && styles.yearGanZhiActive]}>{year.pillar.ganZhi}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={[styles.yearCross, { left: anchorX }]} />
    </View>
  );
}

function MonthWheel({
  canvas,
  months,
  selectedMonth,
  anchorX,
  anchorY,
  onSelect,
}: {
  canvas: { width: number; height: number };
  months: FlowMonth[];
  selectedMonth: FlowMonth | null;
  anchorX: number;
  anchorY: number;
  onSelect: (month: FlowMonth) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const lastIndex = useRef(-1);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  const wheelHeight = 220;
  const pad = (wheelHeight - WHEEL_ITEM_HEIGHT) / 2;

  useEffect(() => {
    if (ready) {
      const index = Math.max(0, months.findIndex((month) => month.id === selectedMonth?.id));
      scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: true });
      setSelected(index);
    }
  }, [months, ready, selectedMonth]);

  const snap = useCallback((animated: boolean) => {
    const raw = Math.round(scrollY.current / WHEEL_ITEM_HEIGHT);
    const index = clamp(raw, 0, Math.max(0, months.length - 1));
    const target = index * WHEEL_ITEM_HEIGHT;
    if (Math.abs(scrollY.current - target) > 1) {
      scrollRef.current?.scrollTo({ y: target, animated });
    }
    if (index !== lastIndex.current) {
      lastIndex.current = index;
      void Haptics.selectionAsync();
      setSelected(index);
      const month = months[index];
      if (month) onSelect(month);
    }
  }, [months, onSelect]);

  return (
    <View style={[styles.monthWheel, { left: anchorX - 20, top: anchorY - wheelHeight / 2, height: wheelHeight }]}>
      <View pointerEvents="none" style={[styles.selectionBand, { top: wheelHeight / 2 - WHEEL_ITEM_HEIGHT / 2, height: WHEEL_ITEM_HEIGHT }]} />
      <ScrollView
        ref={scrollRef}
        bounces={false}
        decelerationRate="fast"
        onContentSizeChange={() => {
          if (!ready) {
            scrollRef.current?.scrollTo({ y: selected * WHEEL_ITEM_HEIGHT, animated: false });
            setReady(true);
          }
        }}
        onMomentumScrollEnd={() => snap(true)}
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        onScrollEndDrag={() => snap(false)}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.monthWheelScroll}
        contentContainerStyle={{ paddingVertical: pad }}
      >
        {months.map((month, index) => {
          const distance = Math.abs(index - selected);
          const scale = 1 - 0.07 * Math.min(3, distance);
          const opacity = 1 - 0.18 * Math.min(3, distance);
          const active = index === selected;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={month.id}
              onPress={() => {
                scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: true });
                setSelected(index);
                onSelect(month);
              }}
              style={[styles.monthItem, { transform: [{ scale }] }]}
            >
              <Text style={[styles.monthText, active && styles.monthTextActive, { opacity }]}>{monthLabel(month)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function DayFan({
  canvas,
  days,
  selectedDay,
  anchorX,
  anchorY,
  onSelect,
}: {
  canvas: { width: number; height: number };
  days: FlowDay[];
  selectedDay: FlowDay | null;
  anchorX: number;
  anchorY: number;
  onSelect: (day: FlowDay) => void;
}) {
  const selectedIndex = Math.max(0, days.findIndex((day) => day.date === selectedDay?.date));
  const start = Math.max(0, selectedIndex - 3);
  const end = Math.min(days.length - 1, selectedIndex + 3);
  const window = days.slice(start, end + 1);
  const dragStart = useRef({ x: 0, index: selectedIndex });
  const lastEmitted = useRef(selectedIndex);
  const pan = useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dx) > 5 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onPanResponderGrant: (_evt, gesture) => {
        dragStart.current = { x: gesture.x0, index: selectedIndex };
        lastEmitted.current = selectedIndex;
      },
      onPanResponderMove: (_evt, gesture) => {
        const delta = Math.round((gesture.moveX - dragStart.current.x) / 44);
        const next = clamp(dragStart.current.index + delta, 0, Math.max(0, days.length - 1));
        if (next !== lastEmitted.current) {
          lastEmitted.current = next;
          const day = days[next];
          if (day) {
            void Haptics.selectionAsync();
            onSelect(day);
          }
        }
      },
    });
  }, [days, onSelect, selectedIndex]);

  return (
    <View {...pan.panHandlers} style={[styles.dayFan, { left: anchorX, top: anchorY }]}>
      {window.map((day, index) => {
        const offset = start + index - selectedIndex;
        const distance = Math.abs(offset);
        const scale = 1 - 0.06 * distance;
        const opacity = 1 - 0.14 * distance;
        const rotation = `${offset * 3}deg` as const;
        const active = offset === 0;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={day.date}
            onPress={() => onSelect(day)}
            style={[
              styles.dayCard,
              {
                left: offset * 44,
                top: -34 + Math.abs(offset) * 7,
                transform: [{ rotate: rotation }, { scale }],
                opacity,
                zIndex: active ? 5 : 1,
              },
              active && styles.dayCardActive,
            ]}
          >
            <Text style={[styles.dayDate, active && styles.dayDateActive]}>{day.date.slice(5).replace("-", ".")}</Text>
            <Text style={[styles.dayPillar, { color: elementColors[day.pillar.stemElement] }]}>{day.pillar.stem}{day.pillar.branch}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HourRing({
  canvas,
  hours,
  anchorX,
  anchorY,
  onSelect,
}: {
  canvas: { width: number; height: number };
  hours: FlowHour[];
  anchorX: number;
  anchorY: number;
  onSelect: (hour: FlowHour) => void;
}) {
  const [selected, setSelected] = useState(0);
  const radius = 92;
  const cx = anchorX;
  const cy = anchorY + 30;
  const dayKey = useRef(-1);

  useEffect(() => {
    const index = clamp(Math.round(hours.length / 2), 0, Math.max(0, hours.length - 1));
    const key = hours[0]?.index ?? -1;
    if (key !== dayKey.current) {
      dayKey.current = key;
      setSelected(index);
      const hour = hours[index];
      if (hour) onSelect(hour);
    }
  }, [hours, onSelect]);

  const dragStart = useRef({ angle: 0, index: selected });
  const pan = useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: (evt) => {
        const dx = evt.nativeEvent.locationX - cx;
        const dy = cy - evt.nativeEvent.locationY;
        dragStart.current = { angle: Math.atan2(dx, dy), index: selected };
      },
      onPanResponderMove: (evt) => {
        const dx = evt.nativeEvent.locationX - cx;
        const dy = cy - evt.nativeEvent.locationY;
        const angle = Math.atan2(dx, dy);
        const step = STEP_RADIANS;
        const delta = Math.round((dragStart.current.angle - angle) / step);
        const next = ((dragStart.current.index + delta) % hours.length + hours.length) % hours.length;
        if (next !== dragStart.current.index) {
          dragStart.current.index = next;
          dragStart.current.angle = angle;
          const hour = hours[next];
          if (hour) {
            void Haptics.selectionAsync();
            setSelected(next);
            onSelect(hour);
          }
        }
      },
    });
  }, [cx, cy, hours, onSelect, selected]);

  return (
    <View {...pan.panHandlers} style={[styles.hourRing, { left: cx - radius, top: cy - radius, width: radius * 2, height: radius * 2 }]}>
      <View pointerEvents="none" style={[styles.focusMarker, { left: radius - 8, top: 0 }]}>
        <Ionicons name="caret-down" size={16} color={palette.accent} />
      </View>
      {hours.map((hour, index) => {
        const angle = (index - selected) * STEP_RADIANS;
        const x = radius + radius * Math.sin(angle);
        const y = radius - radius * Math.cos(angle);
        const distance = Math.abs(index - selected);
        const scale = 1 - 0.05 * distance;
        const opacity = 1 - 0.12 * distance;
        const active = index === selected;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={hour.index}
            onPress={() => {
              void Haptics.selectionAsync();
              setSelected(index);
              onSelect(hour);
            }}
            style={[styles.hourNode, { left: x - 22, top: y - 11, transform: [{ scale }], opacity }]}
          >
            <Text style={[styles.hourText, active && styles.hourTextActive]}>{hour.name.replace("时", "")}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  breadcrumbRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", paddingHorizontal: 2, minHeight: 22 },
  breadcrumbItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  breadcrumbSep: { color: palette.muted, fontSize: 12 },
  breadcrumbText: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  breadcrumbActive: { color: "#6D87B5", fontWeight: "800" },
  canvas: { height: 340, overflow: "hidden" },
  luckAxisWrap: { flex: 1, paddingLeft: 26 },
  luckLine: { position: "absolute", left: 8, top: 0, bottom: 0, width: 1.5, backgroundColor: palette.lineStrong, borderRadius: 1 },
  luckAxisContent: { paddingVertical: 10, gap: 6 },
  luckRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 12 },
  luckDot: { width: 11, height: 11, borderRadius: 6, borderWidth: 1.5, borderColor: palette.lineStrong, backgroundColor: palette.surfaceStrong },
  luckDotActive: { borderColor: palette.accent, backgroundColor: palette.accent },
  luckCopy: { gap: 2 },
  luckGanZhi: { fontSize: 17, fontWeight: "800", color: palette.text, letterSpacing: 1 },
  luckGanZhiActive: { color: palette.accent },
  luckMeta: { fontSize: 10, color: palette.muted, fontWeight: "600" },
  dimmed: { opacity: 0.25 },
  yearAxisWrap: { position: "absolute", left: 60, right: 0, height: 52 },
  yearLine: { position: "absolute", top: 25, height: 1.5, backgroundColor: palette.lineStrong },
  yearAxisContent: { paddingHorizontal: 20, flexDirection: "row", alignItems: "flex-start" },
  yearNode: { alignItems: "center", gap: 1 },
  yearDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: palette.lineStrong, backgroundColor: palette.surfaceStrong },
  yearDotActive: { borderColor: palette.accent, backgroundColor: palette.accent },
  yearText: { fontSize: 12, color: palette.muted, fontWeight: "700" },
  yearTextActive: { color: palette.accent, fontWeight: "800" },
  yearGanZhi: { fontSize: 9, color: palette.muted, fontWeight: "600" },
  yearGanZhiActive: { color: "#6D87B5", fontWeight: "800" },
  yearCross: { position: "absolute", top: -4, bottom: -4, width: 1.5, backgroundColor: "rgba(23,105,224,0.35)" },
  monthWheel: { position: "absolute", width: 130 },
  monthWheelScroll: { width: "100%", height: 220 },
  selectionBand: { position: "absolute", left: 4, right: 4, borderRadius: 14, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.lineStrong, backgroundColor: "rgba(226,233,245,0.5)" },
  monthItem: { height: WHEEL_ITEM_HEIGHT, alignItems: "center", justifyContent: "center" },
  monthText: { fontSize: 17, fontWeight: "800", color: palette.text },
  monthTextActive: { color: palette.accent, fontWeight: "900" },
  dayFan: { position: "absolute", width: 0, height: 0 },
  dayCard: {
    position: "absolute",
    width: 60,
    height: 74,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineStrong,
    backgroundColor: palette.surfaceStrong,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dayCardActive: { borderWidth: 1.5, borderColor: palette.accent, backgroundColor: "rgba(240,246,255,0.95)" },
  dayDate: { fontSize: 12, fontWeight: "800", color: palette.text },
  dayDateActive: { color: palette.accent },
  dayPillar: { fontSize: 10, fontWeight: "700" },
  hourRing: { position: "absolute" },
  focusMarker: { position: "absolute", alignItems: "center" },
  hourNode: { position: "absolute", alignItems: "center", justifyContent: "center", width: 44, height: 22 },
  hourText: { fontSize: 12, fontWeight: "700", color: palette.muted },
  hourTextActive: { fontSize: 14, fontWeight: "900", color: palette.accent },
});
