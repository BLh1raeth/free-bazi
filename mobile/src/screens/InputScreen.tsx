import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BRANCHES,
  STEMS,
  birthInputSchema,
  CITIES,
  hourPillarsForDayStem,
  monthPillarsForYearStem,
  parseGanZhi,
  validBranchesForStem,
  type Branch,
  type BirthInput,
  type CalendarType,
  type Stem,
} from "../../../src/lib/bazi";
import { branchElement } from "../../../src/lib/bazi/five-elements";
import { stemElement } from "../../../src/lib/bazi/ten-gods";
import { DataCard, PrimaryButton, ScreenHeader, Segmented, SystemGlassButton } from "../components/ui";
import { DEFAULT_BIRTH_INPUT } from "../model";
import { elementColors, palette, radii } from "../theme";

type NumericKey = "year" | "month" | "day" | "hour" | "minute";
type NumericDraft = Record<NumericKey, string>;

function toNumericDraft(input: BirthInput): NumericDraft {
  return {
    year: String(input.year), month: String(input.month), day: String(input.day),
    hour: String(input.hour), minute: String(input.minute),
  };
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function daysInMonth(year: number, month: number, lunar: boolean): number {
  // Lunar months are 29 or 30 days; the wheel uses 30 as an upper bound and
  // schema validation rejects impossible dates when the chart is submitted.
  if (lunar) return 30;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function elementColorForGlyph(glyph: string): string {
  if (STEMS.includes(glyph as Stem)) return elementColors[stemElement(glyph as Stem)];
  if (BRANCHES.includes(glyph as Branch)) return elementColors[branchElement(glyph as Branch)];
  return palette.primary;
}

export function InputScreen({ initialInput, initialNote = "", onSubmit }: { initialInput?: BirthInput | null; initialNote?: string; onSubmit: (input: BirthInput, note: string) => void }) {
  const seed = initialInput ?? DEFAULT_BIRTH_INPUT;
  const [input, setInput] = useState<BirthInput>(seed);
  const [numbers, setNumbers] = useState<NumericDraft>(() => toNumericDraft(seed));
  const [errors, setErrors] = useState<string[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [note] = useState(initialNote);
  const [dateDraft, setDateDraft] = useState<NumericDraft>(() => toNumericDraft(seed));

  const selectedCity = useMemo(() => CITIES.find((city) => city.id === input.locationId) ?? CITIES[0], [input.locationId]);
  const update = <K extends keyof BirthInput>(key: K, value: BirthInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  const calendarType = input.calendarType;

  const submit = () => {
    const payload = {
      ...input,
      year: Number(numbers.year), month: Number(numbers.month), day: Number(numbers.day),
      hour: Number(numbers.hour), minute: Number(numbers.minute), showShenSha: true,
    };
    const result = birthInputSchema.safeParse(payload);
    if (!result.success) {
      setErrors([...new Set(result.error.issues.map((issue) => issue.message))]);
      return;
    }
    setErrors([]);
    onSubmit(result.data as BirthInput, note);
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.fill}>
      <ScreenHeader title="排盘" />
      <FlatList
        contentContainerStyle={[styles.content, styles.contentCentered]}
        data={["form"]}
        keyExtractor={(item) => item}
        keyboardShouldPersistTaps="handled"
        style={styles.fill}
        showsVerticalScrollIndicator={false}
        renderItem={() => (
          <>
            <DataCard style={styles.formCard} contentStyle={styles.formContent}>
              <Field label="姓名">
                <TextInput accessibilityLabel="姓名" autoCorrect={false} maxLength={40} onChangeText={(value) => update("name", value)} style={styles.textInput} value={input.name ?? ""} />
              </Field>
              <Field label="性别">
                <View style={styles.controlWidth}>
                  <Segmented label="性别" value={input.gender} options={[{ value: "male", label: "男" }, { value: "female", label: "女" }]} onChange={(value) => update("gender", value)} />
                </View>
              </Field>

              <View style={styles.calendarRow}>
                <Segmented<CalendarType>
                  label="排盘方式"
                  value={calendarType}
                  options={[{ value: "solar", label: "公历" }, { value: "lunar", label: "农历" }, { value: "pillars", label: "四柱" }]}
                  onChange={(value) => update("calendarType", value)}
                />
              </View>

              {calendarType === "pillars" ? (
                <DirectPillarsEditor
                  value={input.directPillars ?? DEFAULT_BIRTH_INPUT.directPillars!}
                  onChange={(directPillars) => update("directPillars", directPillars)}
                />
              ) : (
                <>
                  <Pressable accessibilityRole="button" accessibilityLabel="打开出生时间滚轮" onPress={() => { setDateDraft(numbers); setWheelOpen(true); }} style={styles.birthTimeRow}>
                    <Text style={styles.fieldLabel}>出生时间</Text>
                    <View style={styles.birthTimeValueWrap}><Text style={styles.birthTimeValue}>{numbers.year}-{numbers.month.padStart(2, "0")}-{numbers.day.padStart(2, "0")} {numbers.hour.padStart(2, "0")}:{numbers.minute.padStart(2, "0")}</Text><Ionicons name="chevron-forward" size={14} color={palette.muted} /></View>
                  </Pressable>
                </>
              )}

              <Field label="出生地点">
                <Pressable accessibilityRole="button" accessibilityLabel="选择出生地点" onPress={() => setLocationOpen(true)} style={({ pressed }) => [styles.locationButton, pressed && styles.pressed]}>
                  <Text numberOfLines={1} style={styles.locationValue}>{selectedCity ? `${selectedCity.province} · ${selectedCity.city}` : "请选择"}</Text>
                  <Ionicons name="chevron-forward" size={14} color={palette.muted} />
                </Pressable>
              </Field>

              {calendarType === "pillars" ? <Text style={styles.directHint}>四柱直排不反推出生日期，因此原局完整显示，但大运与起运信息需改用公历或农历生成。</Text> : null}
              {errors.length ? <View accessibilityLiveRegion="polite" style={styles.errorBox}>{errors.map((error) => <Text key={error} style={styles.errorText}>{error}</Text>)}</View> : null}
              <View style={styles.buttonWrap}><PrimaryButton label="开始排盘" onPress={submit} /></View>
            </DataCard>
          </>
        )}
      />

      <DateTimeWheelModal
        calendarType={calendarType}
        numbers={dateDraft}
        onChange={(key, value) => setDateDraft((current) => ({ ...current, [key]: String(value) }))}
        onCancel={() => setWheelOpen(false)}
        onConfirm={() => { setNumbers(dateDraft); setWheelOpen(false); }}
        open={wheelOpen && calendarType !== "pillars"}
      />
      <LocationModal open={locationOpen} selectedId={input.locationId} onClose={() => setLocationOpen(false)} onSelect={(locationId) => { update("locationId", locationId); setLocationOpen(false); }} />
    </KeyboardAvoidingView>
  );
}

function DirectPillarsEditor({ value, onChange }: { value: NonNullable<BirthInput["directPillars"]>; onChange: (value: NonNullable<BirthInput["directPillars"]>) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [active, setActive] = useState<keyof typeof value>("year");
  const [stemStep, setStemStep] = useState(true);
  const labels: Array<[keyof typeof value, string]> = [["year", "年柱"], ["month", "月柱"], ["day", "日柱"], ["hour", "时柱"]];
  const currentYear = parseGanZhi(draft.year);
  const currentDay = parseGanZhi(draft.day);
  const choices = active === "year"
    ? stemStep ? [...STEMS] : validBranchesForStem(currentYear.stem)
    : active === "month"
      ? monthPillarsForYearStem(currentYear.stem)
      : active === "day"
        ? stemStep ? [...STEMS] : validBranchesForStem(currentDay.stem)
        : hourPillarsForDayStem(currentDay.stem);

  // Year and day pillars share the same two-step flow: pick a stem, then pick
  // one of the valid branch partners; the companion pillar (month/hour) is
  // re-derived from the chosen stem.
  const choosePillarPair = (pillarKey: "year" | "day", choice: string) => {
    const current = parseGanZhi(draft[pillarKey]);
    const companionKey = pillarKey === "year" ? "month" : "hour";
    if (stemStep) {
      const stem = choice as Stem;
      const companions = pillarKey === "year" ? monthPillarsForYearStem(stem) : hourPillarsForDayStem(stem);
      const branch = validBranchesForStem(stem).includes(current.branch) ? current.branch : validBranchesForStem(stem)[0]!;
      setDraft((currentDraft) => ({
        ...currentDraft,
        [pillarKey]: `${stem}${branch}`,
        [companionKey]: companions.includes(currentDraft[companionKey]) ? currentDraft[companionKey] : companions[0]!,
      }));
      setStemStep(false);
    } else {
      setDraft((currentDraft) => ({ ...currentDraft, [pillarKey]: `${current.stem}${choice}` }));
      setActive(pillarKey === "year" ? "month" : "hour");
    }
  };

  const choose = (choice: string) => {
    if (active === "year") {
      choosePillarPair("year", choice);
      return;
    }
    if (active === "month") {
      setDraft((current) => ({ ...current, month: choice }));
      setActive("day");
      setStemStep(true);
      return;
    }
    if (active === "day") {
      choosePillarPair("day", choice);
      return;
    }
    setDraft((current) => ({ ...current, hour: choice }));
  };

  const selectPillar = (key: keyof typeof value) => {
    setActive(key);
    setStemStep(key === "year" || key === "day");
  };
  return (
    <>
      <Pressable accessibilityLabel="打开四柱联动选择" accessibilityRole="button" onPress={() => { setDraft(value); setActive("year"); setStemStep(true); setOpen(true); }}>
        <DataCard style={styles.directSummary} contentStyle={styles.directSummaryContent}>
          {labels.map(([key, label]) => <View key={key} style={styles.directSummaryColumn}><Text style={styles.directLabel}>{label}</Text><Text style={styles.directSummaryStem}>{draft[key][0]}</Text><Text style={styles.directSummaryBranch}>{draft[key][1]}</Text></View>)}
          <Ionicons name="chevron-forward" size={15} color={palette.muted} />
        </DataCard>
      </Pressable>
      <Modal animationType="slide" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.directSheet}>
            <SafeAreaView edges={["bottom"]} style={styles.directSheetSafeArea}>
              <View style={styles.modalHeader}>
                <Pressable style={styles.modalHeaderButton} onPress={() => setOpen(false)}><Text style={[styles.modalHeaderButtonText, styles.cancelText]}>取消</Text></Pressable>
                <Text style={styles.modalTitle}>四柱联动选择</Text>
                <Pressable style={styles.modalHeaderButton} onPress={() => { onChange(draft); setOpen(false); }}><Text style={styles.modalHeaderButtonText}>确定</Text></Pressable>
              </View>
              <View style={styles.pillarSelector}>
                {labels.map(([key, label]) => {
                  const parsed = parseGanZhi(draft[key]);
                  return <Pressable key={key} onPress={() => selectPillar(key)} style={styles.selectorColumn}><Text style={styles.selectorLabel}>{label}</Text><View style={[styles.selectorGlyph, active === key && (stemStep || key === "month" || key === "hour") && styles.selectorActive]}><Text style={styles.selectorStem}>{parsed.stem}</Text></View><View style={[styles.selectorGlyph, active === key && !stemStep && (key === "year" || key === "day") && styles.selectorActive]}><Text style={styles.selectorBranch}>{parsed.branch}</Text></View></Pressable>;
                })}
              </View>
              <Text style={styles.choiceHint}>{active === "year" && stemStep ? "先选年干" : active === "year" ? "按阴阳配对选择六个有效年支" : active === "month" ? "年柱已定：从五虎遁十二月柱中选择" : active === "day" && stemStep ? "选择日干" : active === "day" ? "选择六个有效日支" : "日柱已定：从五鼠遁十二时柱中选择"}</Text>
              <View style={styles.directChoiceGrid}>
                {choices.map((choice) => {
                  const selectedChoice = active === "year"
                    ? stemStep ? currentYear.stem : currentYear.branch
                    : active === "month"
                      ? draft.month
                      : active === "day"
                        ? stemStep ? currentDay.stem : currentDay.branch
                        : draft.hour;
                  const selected = choice === selectedChoice;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={choice}
                      onPress={() => choose(choice)}
                      style={({ pressed }) => [
                        styles.directChoice,
                        choice.length > 1 && styles.directPairChoice,
                        selected && styles.directChoiceSelected,
                        pressed && styles.directChoicePressed,
                      ]}
                    >
                      <View style={styles.directChoiceSurface}>
                        {choice.length === 1 ? (
                          <Text style={[styles.choiceText, { color: elementColorForGlyph(choice) }]}>{choice}</Text>
                        ) : (
                          <View style={styles.directChoicePair}>
                            <Text style={[styles.choiceText, { color: elementColorForGlyph(choice[0]!) }]}>{choice[0]}</Text>
                            <Text style={[styles.choiceText, { color: elementColorForGlyph(choice[1]!) }]}>{choice[1]}</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function DateTimeWheelModal({ open, numbers, calendarType, onChange, onCancel, onConfirm }: { open: boolean; numbers: NumericDraft; calendarType: CalendarType; onChange: (key: NumericKey, value: number) => void; onCancel: () => void; onConfirm: () => void }) {
  const year = Number(numbers.year) || 1990;
  const month = Math.min(12, Math.max(1, Number(numbers.month) || 1));
  const dayMax = daysInMonth(year, month, calendarType === "lunar");
  const columns: Array<{ key: NumericKey; suffix: string; values: number[] }> = [
    { key: "year", suffix: "年", values: range(1900, 2100) },
    { key: "month", suffix: "月", values: range(1, 12) },
    { key: "day", suffix: "日", values: range(1, dayMax) },
    { key: "hour", suffix: "时", values: range(0, 23) },
    { key: "minute", suffix: "分", values: range(0, 59) },
  ];
  useEffect(() => {
    if (Number(numbers.day) > dayMax) onChange("day", dayMax);
  }, [dayMax, numbers.day, onChange]);
  return (
    <Modal animationType="slide" transparent onRequestClose={onCancel} visible={open}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.dateSheet}>
          <SafeAreaView edges={["bottom"]} style={styles.dateModalSafeArea}>
            <View style={styles.sheetGrabber} />
            <View style={styles.dateModalHeader}>
              <SystemGlassButton label="取消" onPress={onCancel} style={styles.dateHeaderAction} />
              <View style={styles.dateHeaderCopy}>
                <Text style={styles.modalTitle}>出生时间</Text>
                <Text style={styles.datePreview}>{year}年{String(month).padStart(2, "0")}月{String(Math.min(dayMax, Number(numbers.day) || 1)).padStart(2, "0")}日 · {String(Number(numbers.hour) || 0).padStart(2, "0")}:{String(Number(numbers.minute) || 0).padStart(2, "0")}</Text>
              </View>
              <SystemGlassButton label="完成" onPress={onConfirm} style={styles.dateHeaderAction} />
            </View>
            <View style={styles.wheelPanel}>
              <View pointerEvents="none" style={styles.wheelFocusLayer}>
                <View style={styles.wheelFocusLens} />
              </View>
              <View style={styles.wheelColumns}>
                {columns.map((column) => <SnapWheelColumn column={column} key={column.key} numbers={numbers} onChange={onChange} />)}
              </View>
            </View>
            <Text style={styles.wheelHint}>滑动选择，中央玻璃焦点即为当前时间</Text>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const WHEEL_ROW_HEIGHT = 44;
const WHEEL_SIDE_PADDING = WHEEL_ROW_HEIGHT * 2;

function SnapWheelColumn({
  column,
  numbers,
  onChange,
}: {
  column: { key: NumericKey; suffix: string; values: number[] };
  numbers: NumericDraft;
  onChange: (key: NumericKey, value: number) => void;
}) {
  const listRef = useRef<FlatList<number>>(null);
  const selected = Math.min(column.values.at(-1)!, Math.max(column.values[0]!, Number(numbers[column.key]) || column.values[0]!));
  const selectedIndex = Math.max(0, column.values.indexOf(selected));
  const scrollY = useRef(new Animated.Value(selectedIndex * WHEEL_ROW_HEIGHT)).current;

  useEffect(() => {
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ animated: false, offset: selectedIndex * WHEEL_ROW_HEIGHT }));
  }, [selectedIndex]);

  const commit = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.max(0, Math.min(column.values.length - 1, Math.round(event.nativeEvent.contentOffset.y / WHEEL_ROW_HEIGHT)));
    const value = column.values[index];
    if (value !== undefined && value !== selected) onChange(column.key, value);
  };

  return (
    <View style={[styles.snapWheelColumn, column.key === "year" && styles.snapYearWheelColumn]}>
      <Animated.FlatList
        accessibilityLabel={`${column.key}滚轮`}
        contentContainerStyle={styles.snapWheelContent}
        data={column.values}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ index, length: WHEEL_ROW_HEIGHT, offset: WHEEL_ROW_HEIGHT * index })}
        initialScrollIndex={selectedIndex}
        keyExtractor={(value) => String(value)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={commit}
        onScrollEndDrag={commit}
        ref={listRef}
        renderItem={({ item, index }) => {
          const scale = scrollY.interpolate({
            inputRange: [(index - 2) * WHEEL_ROW_HEIGHT, index * WHEEL_ROW_HEIGHT, (index + 2) * WHEEL_ROW_HEIGHT],
            outputRange: [0.82, 1, 0.82],
            extrapolate: "clamp",
          });
          const opacity = scrollY.interpolate({
            inputRange: [(index - 2) * WHEEL_ROW_HEIGHT, index * WHEEL_ROW_HEIGHT, (index + 2) * WHEEL_ROW_HEIGHT],
            outputRange: [0.26, 1, 0.26],
            extrapolate: "clamp",
          });
          return (
          <View style={styles.snapWheelRow}>
            <Animated.Text numberOfLines={1} style={[styles.snapWheelValue, { opacity, transform: [{ scale }] }]}>
              {item}<Text style={styles.snapWheelInlineSuffix}>{column.suffix}</Text>
            </Animated.Text>
          </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={WHEEL_ROW_HEIGHT}
      />
    </View>
  );
}

function LocationModal({ open, selectedId, onClose, onSelect }: { open: boolean; selectedId: string; onClose: () => void; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const initialCity = CITIES.find((city) => city.id === selectedId) ?? CITIES[0]!;
  const provinces = useMemo(() => [...new Set(CITIES.map((city) => city.province))], []);
  const [province, setProvince] = useState(initialCity.province);
  const [draftId, setDraftId] = useState(selectedId);
  useEffect(() => {
    if (!open) return;
    const city = CITIES.find((item) => item.id === selectedId) ?? CITIES[0]!;
    setProvince(city.province);
    setDraftId(city.id);
  }, [open, selectedId]);
  const locations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return keyword ? CITIES.filter((city) => `${city.province}${city.city}${city.id}`.toLowerCase().includes(keyword)) : CITIES.filter((city) => city.province === province);
  }, [province, query]);
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={open}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.dateSheet}>
          <SafeAreaView edges={["bottom"]} style={styles.dateModalSafeArea}>
            <View style={styles.sheetGrabber} />
            <View style={styles.dateModalHeader}>
              <SystemGlassButton label="取消" onPress={onClose} style={styles.dateHeaderAction} />
              <Text style={styles.modalTitle}>选择出生地点</Text>
              <SystemGlassButton label="完成" onPress={() => onSelect(draftId)} style={styles.dateHeaderAction} />
            </View>
            <View style={[styles.searchWrap, styles.locationSearchWrap]}><Ionicons name="search" size={16} color={palette.muted} /><TextInput accessibilityLabel="搜索中国城市" autoCorrect={false} onChangeText={setQuery} placeholder="搜索省份或城市" placeholderTextColor={palette.muted} style={styles.searchInput} value={query} /></View>
            {!query ? <View style={[styles.locationWheels, styles.locationWheelsInSheet]}>
              <View style={styles.provinceWheel}><Picker selectedValue={province} onValueChange={(value) => { const nextProvince = String(value); setProvince(nextProvince); const first = CITIES.find((city) => city.province === nextProvince); if (first) setDraftId(first.id); }} itemStyle={styles.locationPickerItem}>{provinces.map((item) => <Picker.Item key={item} label={item} value={item} />)}</Picker></View>
              <View style={styles.cityWheel}><Picker selectedValue={locations.some((city) => city.id === draftId) ? draftId : locations[0]?.id} onValueChange={(value) => value && setDraftId(String(value))} itemStyle={styles.locationPickerItem}>{locations.map((city) => <Picker.Item key={city.id} label={city.city} value={city.id} />)}</Picker></View>
            </View> : null}
            <FlatList contentContainerStyle={[styles.locationList, styles.locationListInSheet]} data={locations} keyboardShouldPersistTaps="handled" keyExtractor={(city) => city.id} style={styles.locationListFill} renderItem={({ item }) => {
              const selected = item.id === draftId;
              return <Pressable onPress={() => setDraftId(item.id)} style={styles.locationRow}><View><Text style={styles.locationRowTitle}>{item.city}</Text><Text style={styles.locationRowMeta}>{item.province} · 中国标准时间</Text></View>{selected ? <Ionicons name="checkmark-circle" size={20} color={palette.accent} /> : null}</Pressable>;
            }} />
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, children, stacked = false }: { label: string; children: React.ReactNode; stacked?: boolean }) {
  return <View style={[styles.field, stacked && styles.fieldStacked]}><Text style={styles.fieldLabel}>{label}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 14, paddingBottom: 132, gap: 8 },
  contentCentered: { flexGrow: 1, justifyContent: "center" },
  formCard: { borderRadius: radii.large, borderWidth: 0, borderColor: "transparent" },
  formContent: { paddingHorizontal: 12, paddingBottom: 12 },
  field: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
    gap: 10,
  },
  fieldStacked: {
    minHeight: 78,
    alignItems: "stretch",
    flexDirection: "column",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  fieldLabel: { color: palette.text, fontSize: 13, fontWeight: "800" },
  textInput: { flex: 1, minHeight: 38, color: palette.text, fontSize: 13, textAlign: "right" },
  controlWidth: { width: "62%" },
  calendarRow: { paddingVertical: 8, flexDirection: "row", gap: 6 },
  birthTimeRow: {
    minHeight: 66,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  birthTimeValueWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  birthTimeValue: { color: palette.text, fontSize: 12, fontWeight: "700" },
  locationButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  locationValue: { maxWidth: "84%", color: palette.text, fontSize: 12, fontWeight: "600" },
  directSummary: { height: 126, borderRadius: radii.medium, marginVertical: 8 },
  directSummaryContent: { flex: 1, paddingHorizontal: 8, flexDirection: "row", alignItems: "center" },
  directSummaryColumn: { flex: 1, alignItems: "center", gap: 1 },
  directLabel: { color: palette.primary, fontSize: 10, fontWeight: "800", marginBottom: 4 },
  directSummaryStem: { color: palette.accent, fontSize: 25, lineHeight: 30, fontWeight: "800" },
  directSummaryBranch: { color: palette.text, fontSize: 25, lineHeight: 30, fontWeight: "800" },
  directHint: { color: palette.muted, fontSize: 8, lineHeight: 12, marginTop: 8 },
  sheetBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,31,54,0.30)" },
  directSheet: {
    height: 620,
    maxHeight: "78%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "rgba(252,253,255,0.99)",
    overflow: "hidden",
  },
  directSheetSafeArea: { flex: 1 },
  cancelText: { color: palette.muted, textAlign: "left" },
  pillarSelector: { flexDirection: "row", paddingHorizontal: 22, paddingTop: 12 },
  selectorColumn: { flex: 1, alignItems: "center", gap: 8 },
  selectorLabel: { color: palette.text, fontSize: 13, fontWeight: "700" },
  selectorGlyph: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(246,236,226,0.74)",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  selectorActive: { borderColor: palette.accent, backgroundColor: "rgba(255,255,255,0.92)" },
  selectorStem: { color: palette.accent, fontSize: 23, fontWeight: "800" },
  selectorBranch: { color: palette.primary, fontSize: 23, fontWeight: "800" },
  choiceHint: { marginTop: 18, color: palette.muted, fontSize: 10, textAlign: "center" },
  directChoiceGrid: {
    marginTop: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 7,
  },
  directChoice: { width: "18%", height: 58, borderRadius: 18, overflow: "hidden" },
  directPairChoice: { width: "14.5%" },
  directChoiceSurface: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(64,79,106,0.15)",
  },
  directChoiceSelected: {
    borderWidth: 1.5,
    borderColor: "rgba(51,111,193,0.78)",
    backgroundColor: "rgba(242,246,252,0.98)",
  },
  directChoicePressed: { opacity: 0.7 },
  directChoicePair: { flex: 1, alignItems: "center", justifyContent: "center" },
  choiceText: { color: palette.primary, fontSize: 20, lineHeight: 24, fontWeight: "800" },
  errorBox: {
    marginTop: 8,
    padding: 9,
    borderRadius: 11,
    backgroundColor: "rgba(196,83,76,0.08)",
    gap: 2,
  },
  errorText: { color: palette.danger, fontSize: 10 },
  buttonWrap: { paddingTop: 10, width: "100%" },
  pressed: { opacity: 0.7 },
  modalHeader: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  modalHeaderButton: { width: 52 },
  modalHeaderButtonText: { color: palette.accent, fontSize: 13, fontWeight: "700", textAlign: "right" },
  modalTitle: { color: palette.primary, fontSize: 16, fontWeight: "800" },
  dateSheet: {
    height: 390,
    overflow: "hidden",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(64,79,106,0.14)",
    backgroundColor: "rgba(252,253,255,0.99)",
  },
  dateModalSafeArea: { flex: 1, backgroundColor: "transparent", paddingHorizontal: 12 },
  sheetGrabber: {
    alignSelf: "center",
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(76,103,145,0.22)",
    marginTop: 8,
  },
  dateModalHeader: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  dateHeaderAction: { width: 56, height: 32, borderRadius: 16 },
  dateHeaderCopy: { flex: 1, alignItems: "center", gap: 2 },
  datePreview: { color: palette.muted, fontSize: 8.5, fontWeight: "600" },
  wheelPanel: {
    height: 226,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(64,79,106,0.14)",
    backgroundColor: "rgba(246,248,252,0.98)",
  },
  wheelFocusLayer: { position: "absolute", zIndex: 1, left: 8, right: 8, top: 88, height: 44 },
  wheelFocusLens: {
    flex: 1,
    borderRadius: 15,
    backgroundColor: "rgba(235,239,246,0.88)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(64,79,106,0.14)",
  },
  wheelColumns: {
    zIndex: 2,
    height: 220,
    flexDirection: "row",
    paddingHorizontal: 6,
    alignItems: "stretch",
    gap: 2,
  },
  snapWheelColumn: { position: "relative", flex: 1, height: 220, minWidth: 0, overflow: "hidden" },
  snapYearWheelColumn: { flex: 1.45 },
  snapWheelContent: { paddingVertical: WHEEL_SIDE_PADDING },
  snapWheelRow: { height: WHEEL_ROW_HEIGHT, alignItems: "center", justifyContent: "center" },
  snapWheelValue: {
    width: "100%",
    color: palette.primary,
    fontSize: 15,
    lineHeight: WHEEL_ROW_HEIGHT,
    fontWeight: "700",
    textAlign: "center",
    includeFontPadding: false,
  },
  snapWheelInlineSuffix: { color: palette.muted, fontSize: 9, fontWeight: "700", includeFontPadding: false },
  wheelHint: { textAlign: "center", color: palette.muted, fontSize: 8.5, marginTop: 8 },
  searchWrap: {
    marginHorizontal: 14,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineStrong,
    backgroundColor: palette.surfaceStrong,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  searchInput: { flex: 1, color: palette.text, fontSize: 13 },
  locationSearchWrap: { marginHorizontal: 0 },
  locationWheelsInSheet: { marginHorizontal: 0 },
  locationList: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 24 },
  locationListInSheet: { paddingHorizontal: 0 },
  locationListFill: { flex: 1 },
  locationRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
  },
  locationRowTitle: { color: palette.text, fontSize: 13, fontWeight: "700" },
  locationRowMeta: { color: palette.muted, fontSize: 9, marginTop: 2 },
  locationWheels: {
    height: 186,
    flexDirection: "row",
    marginHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
  },
  provinceWheel: { flex: 1.2 },
  cityWheel: { flex: 1 },
  locationPickerItem: { height: 156, fontSize: 17, color: palette.text },
});
