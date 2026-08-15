import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import { Animated, FlatList, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { calculateBaziChart, type BaziChart, type Pillar } from "../../../src/lib/bazi";
import { DataCard, GlassSurface, GlassTitle, Segmented } from "../components/ui";
import type { ChartRecord } from "../model";
import { elementColors, palette, radii } from "../theme";

function recordName(record: ChartRecord): string {
  return record.input.name?.trim() || "未命名命盘";
}

function recordDateText(record: ChartRecord): string {
  if (record.input.calendarType === "pillars" && record.input.directPillars) {
    const value = record.input.directPillars;
    return `四柱 ${value.year} ${value.month} ${value.day} ${value.hour}`;
  }
  return `${record.input.year}-${String(record.input.month).padStart(2, "0")}-${String(record.input.day).padStart(2, "0")}${record.input.timeKnown ? ` ${String(record.input.hour).padStart(2, "0")}:${String(record.input.minute).padStart(2, "0")}` : " 时辰未知"}`;
}

function RecordPreview({ record, onOpen, onDelete }: { record: ChartRecord; onOpen: () => void; onDelete: () => void }) {
  const chart = useMemo<BaziChart | null>(() => {
    try {
      return calculateBaziChart(record.id, { ...record.input, showShenSha: true });
    } catch {
      return null;
    }
  }, [record]);
  const pillars = chart?.pillars.filter((pillar): pillar is Pillar => pillar !== null) ?? [];
  const gender = record.input.gender === "male" ? "男" : record.input.gender === "female" ? "女" : "未指定";

  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = translateX.interpolate({
    inputRange: [-72, -14, 0],
    outputRange: [1, 0, 0],
    extrapolate: "clamp",
  });
  const startX = useRef(0);
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 3 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.12,
    onPanResponderGrant: () => { translateX.stopAnimation((value) => { startX.current = value; }); },
    onPanResponderMove: (_, gesture) => translateX.setValue(Math.max(-92, Math.min(0, startX.current + gesture.dx))),
    onPanResponderRelease: (_, gesture) => {
      const next = startX.current + gesture.dx;
      const open = gesture.vx < -0.28 || next < -22;
      Animated.spring(translateX, { toValue: open ? -72 : 0, useNativeDriver: true, stiffness: 300, damping: 27, mass: 0.68 }).start();
    },
    onPanResponderTerminate: () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true, stiffness: 260, damping: 28 }).start(),
  }), [translateX]);

  const handlePress = () => {
    translateX.stopAnimation((value) => {
      if (value < -10) {
        // The row is swiped open; tapping closes it instead of opening the chart.
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, stiffness: 260, damping: 28 }).start();
      } else {
        onOpen();
      }
    });
  };

  return (
    <View style={styles.swipeShell}>
      <Animated.View pointerEvents="box-none" style={[styles.deleteAction, { opacity: deleteOpacity }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`删除${recordName(record)}`} onPress={onDelete} style={styles.deleteActionContent}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.deleteText}>删除</Text>
        </Pressable>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX }] }} {...pan.panHandlers}>
        <Pressable accessibilityRole="button" accessibilityLabel={`打开${recordName(record)}的命盘`} onPress={handlePress}>
          <GlassSurface interactive style={styles.recordCard} contentStyle={styles.recordContent}>
            <View style={styles.recordIdentity}>
              <View style={styles.avatar}><Ionicons name="person-outline" size={20} color={palette.accent} /></View>
              <View style={styles.recordText}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={styles.recordName}>{recordName(record)}</Text>
                  <Text style={styles.gender}>{gender}</Text>
                </View>
                <Text style={styles.recordDate}>{recordDateText(record)}</Text>
              </View>
            </View>
            <View style={styles.pillarPreview}>
              {pillars.map((pillar) => (
                <View key={pillar.label} style={styles.previewColumn}>
                  <Text style={[styles.previewGlyph, { color: elementColors[pillar.stemElement] }]}>{pillar.stem}</Text>
                  <Text style={[styles.previewGlyph, { color: elementColors[pillar.branchElement] }]}>{pillar.branch}</Text>
                </View>
              ))}
            </View>
            <Ionicons name="chevron-forward" size={16} color={palette.muted} />
          </GlassSurface>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function ArchiveScreen({
  records,
  onOpen,
  onDelete,
}: {
  records: ChartRecord[];
  onOpen: (record: ChartRecord) => void;
  onDelete: (record: ChartRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "birth">("recent");
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const matched = keyword
      ? records.filter((record) => `${recordName(record)}${record.input.year}${record.input.month}${record.input.day}`.toLowerCase().includes(keyword))
      : [...records];
    return matched.sort((a, b) => {
      if (sortBy === "name") return recordName(a).localeCompare(recordName(b), "zh-CN-u-co-pinyin");
      if (sortBy === "birth") return a.input.year - b.input.year || a.input.month - b.input.month || a.input.day - b.input.day;
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }, [query, records, sortBy]);

  return (
    <View style={styles.fill}>
      <FlatList
        contentContainerStyle={styles.content}
        data={filtered}
        keyExtractor={(record) => record.id}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.titleRow}>
              <GlassTitle title="档案库" />
            </View>
            <GlassSurface style={styles.search} contentStyle={styles.searchContent}>
              <Ionicons name="search" size={16} color={palette.muted} />
              <TextInput
                accessibilityLabel="搜索档案"
                onChangeText={setQuery}
                placeholder="搜索姓名或出生年份"
                placeholderTextColor={palette.muted}
                style={styles.searchInput}
                value={query}
              />
            </GlassSurface>
            <Segmented
              label="档案排序"
              style={styles.archiveSortSelector}
              value={sortBy}
              options={[
                { value: "recent", label: "添加时间" },
                { value: "name", label: "姓名首字母" },
                { value: "birth", label: "出生年份" },
              ]}
              onChange={setSortBy}
            />
            <View style={styles.archiveMeta}>
              <Text style={styles.archiveCount}>{records.length} 份本地命盘</Text>
              <Text style={styles.archivePrivacy}>仅保存在此设备</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <DataCard contentStyle={styles.empty}>
            <Ionicons name="folder-open-outline" size={34} color={palette.muted} />
            <Text style={styles.emptyTitle}>{records.length === 0 ? "还没有命盘档案" : "没有匹配的档案"}</Text>
            <Text style={styles.emptyText}>{records.length === 0 ? "完成一次排盘后会自动保存到这里。" : "换一个姓名或年份试试。"}</Text>
          </DataCard>
        }
        renderItem={({ item }) => <RecordPreview record={item} onOpen={() => onOpen(item)} onDelete={() => onDelete(item)} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 14, paddingBottom: 132 },
  headerBlock: { gap: 8, marginBottom: 10 },
  titleRow: { paddingTop: 10, alignItems: "center" },
  archiveSortSelector: { marginTop: 8 },
  search: { height: 42, borderRadius: radii.pill },
  searchContent: { flex: 1, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 8 },
  searchInput: { flex: 1, color: palette.text, fontSize: 13 },
  archiveMeta: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 3 },
  archiveCount: { color: palette.primary, fontSize: 11, fontWeight: "800" },
  archivePrivacy: { color: palette.muted, fontSize: 9 },
  separator: { height: 8 },
  recordCard: { minHeight: 91, borderRadius: radii.large, backgroundColor: palette.surfaceStrong },
  swipeShell: { borderRadius: radii.large, overflow: "hidden", backgroundColor: "transparent" },
  deleteAction: { position: "absolute", right: 0, top: 0, bottom: 0, width: 72, backgroundColor: palette.danger },
  deleteActionContent: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  deleteText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  recordContent: { flex: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  recordIdentity: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: palette.lineStrong },
  recordText: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  recordName: { maxWidth: 102, color: palette.text, fontSize: 14, fontWeight: "800" },
  gender: { color: palette.muted, fontSize: 9 },
  recordDate: { color: palette.muted, fontSize: 9 },
  pillarPreview: { flexDirection: "row", alignItems: "center", gap: 5 },
  previewColumn: { alignItems: "center" },
  previewGlyph: { fontSize: 15, lineHeight: 18, fontWeight: "800" },
  empty: { minHeight: 190, alignItems: "center", justifyContent: "center", gap: 7 },
  emptyTitle: { color: palette.primary, fontSize: 14, fontWeight: "800" },
  emptyText: { color: palette.muted, fontSize: 10 },
});
