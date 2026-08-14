import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { DataCard, LiquidSelector, PrimaryButton, ScreenHeader, SystemGlassButton } from "../components/ui";
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
                  <LiquidSelector label="性别" value={input.gender} options={[{ value: "male", label: "男" }, { value: "female", label: "女" }]} onChange={(value) => update("gender", value)} />
                </View>
              </Field>

              <View style={styles.calendarRow}>
                <LiquidSelector<CalendarType>
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
              <View style={styles.timeWheelRow}>
                {columns.map((column) => {
                  const selected = Math.min(column.values.at(-1)!, Math.max(column.values[0]!, Number(numbers[column.key]) || column.values[0]!));
                  return (
                    <View key={column.key} style={[styles.timeWheelColumn, column.key === "year" && styles.timeYearWheelColumn]}>
                      <Picker
                        accessibilityLabel={`${column.key}滚轮`}
                        itemStyle={styles.timePickerItem}
                        onValueChange={(value) => value != null && onChange(column.key, Number(value))}
                        selectedValue={selected}
                      >
                        {column.values.map((value) => <Picker.Item key={value} label={`${value}${column.suffix}`} value={value} />)}
                      </Picker>
                    </View>
                  );
                })}
              </View>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

function LocationModal({ open, selectedId, onClose, onSelect }: { open: boolean; selectedId: string; onClose: () => void; onSelect: (id: string) => void }) {
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
  const cities = useMemo(() => CITIES.filter((city) => city.province === province), [province]);
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
            <View style={styles.locationWheelPanel}>
              <View style={styles.provinceWheel}><Picker selectedValue={province} onValueChange={(value) => { const nextProvince = String(value); setProvince(nextProvince); const first = CITIES.find((city) => city.province === nextProvince); if (first) setDraftId(first.id); }} itemStyle={styles.locationPickerItem}>{provinces.map((item) => <Picker.Item key={item} label={item} value={item} />)}</Picker></View>
              <View style={styles.cityWheel}><Picker selectedValue={cities.some((city) => city.id === draftId) ? draftId : cities[0]?.id} onValueChange={(value) => value && setDraftId(String(value))} itemStyle={styles.locationPickerItem}>{cities.map((city) => <Picker.Item key={city.id} label={city.city} value={city.id} />)}</Picker></View>
            </View>
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
    backgroundColor: "rgba(246,248,252,0.98)",
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
  wheelPanel: { flex: 1, backgroundColor: "transparent" },
  timeWheelRow: { flex: 1, flexDirection: "row" },
  timeWheelColumn: { flex: 1.15, minWidth: 0 },
  timeYearWheelColumn: { flex: 2.2 },
  timePickerItem: { height: 150, fontSize: 13, color: palette.text },
  locationWheelPanel: { flex: 1, flexDirection: "row" },
  provinceWheel: { flex: 1.2 },
  cityWheel: { flex: 1 },
  locationPickerItem: { height: 156, fontSize: 17, color: palette.text },
});
