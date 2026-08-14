import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { calculateBaziChart, type BaziChart, type BirthInput } from "../src/lib/bazi";
import { BottomNav, ContentTransition, GlassPreferencesProvider, type AppTab } from "./src/components/ui";
import { DEFAULT_SETTINGS, type AppSettings, type ChartRecord } from "./src/model";
import { ArchiveScreen } from "./src/screens/ArchiveScreen";
import { ChartScreen } from "./src/screens/ChartScreen";
import { InputScreen } from "./src/screens/InputScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { loadArchive, loadLastInput, loadSettings, saveArchive, saveLastInput, saveSettings } from "./src/storage";
import { palette } from "./src/theme";

function normalizedStoredInput(input: BirthInput): BirthInput {
  return {
    ...input,
    directPillars: input.directPillars ?? { year: "甲子", month: "丙寅", day: "甲子", hour: "甲子" },
    showShenSha: true,
  };
}

export default function App() {
  const [tab, setTab] = useState<AppTab>("input");
  const [lastInput, setLastInput] = useState<BirthInput | null>(null);
  const [records, setRecords] = useState<ChartRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");
  const [chart, setChart] = useState<BaziChart | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;
    void Promise.all([loadSettings(), loadLastInput(), loadArchive()]).then(
      ([storedSettings, storedInput, storedRecords]) => {
        if (!active) return;
        if (storedSettings) setSettings(storedSettings);
        const auditedRecords = storedRecords.map((record) => ({ ...record, input: normalizedStoredInput(record.input) }));
        if (auditedRecords.length > 0) {
          setRecords(auditedRecords);
          setLastInput(auditedRecords[0]!.input);
          setTab("archive");
        } else if (storedInput) {
          const input = normalizedStoredInput(storedInput);
          const now = new Date().toISOString();
          const migrated: ChartRecord = { id: `chart-${Date.now()}`, input, createdAt: now, updatedAt: now };
          setRecords([migrated]);
          setLastInput(input);
          setTab("archive");
          void saveArchive([migrated]);
        }
      },
    );
    return () => { active = false; };
  }, []);

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    void saveSettings(next);
  }, []);

  const openRecord = useCallback((record: ChartRecord) => {
    try {
      const input = normalizedStoredInput(record.input);
      setChart(calculateBaziChart(record.id, input));
      setSelectedRecordId(record.id);
      setLastInput(input);
      setTab("archive");
    } catch {
      // Invalid legacy records stay isolated instead of crashing the archive.
    }
  }, []);

  const startNew = useCallback(() => {
    setEditingRecordId(null);
    setEditingNote("");
    setLastInput(null);
    setChart(null);
    setSelectedRecordId(null);
    setTab("input");
  }, []);

  const submitInput = useCallback((input: BirthInput, note: string) => {
    const normalizedInput: BirthInput = {
      ...input,
      dayBoundaryRule: settings.dayBoundaryRule,
      showShenSha: true,
    };
    const now = new Date().toISOString();
    const id = editingRecordId ?? `chart-${Date.now()}`;
    const previous = records.find((record) => record.id === id);
    const nextRecord: ChartRecord = {
      id,
      input: normalizedInput,
      note: note.trim() || undefined,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };
    const nextRecords = [nextRecord, ...records.filter((record) => record.id !== id)];
    setRecords(nextRecords);
    setLastInput(normalizedInput);
    setChart(calculateBaziChart(id, normalizedInput));
    setSelectedRecordId(id);
    setEditingRecordId(null);
    void Promise.all([saveArchive(nextRecords), saveLastInput(normalizedInput)]);
    setTab("archive");
  }, [editingRecordId, records, settings.dayBoundaryRule]);

  const deleteRecord = useCallback((record: ChartRecord) => {
    Alert.alert("删除命盘", `确定删除“${record.input.name?.trim() || "未命名命盘"}”吗？`, [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: () => {
        const next = records.filter((item) => item.id !== record.id);
        setRecords(next);
        if (selectedRecordId === record.id) { setChart(null); setSelectedRecordId(null); }
        void saveArchive(next);
      } },
    ]);
  }, [records, selectedRecordId]);

  const currentScreen = useMemo(() => {
    if (tab === "input") {
      return <InputScreen key={editingRecordId ?? "new"} initialInput={editingRecordId ? lastInput : null} initialNote={editingRecordId ? editingNote : ""} onSubmit={submitInput} />;
    }
    if (tab === "archive") {
      return chart && selectedRecordId ? (
        <ChartScreen
          chart={chart}
          onBackToArchive={() => { setChart(null); setSelectedRecordId(null); }}
          note={records.find((record) => record.id === selectedRecordId)?.note}
          onEditInput={() => { const record = records.find((item) => item.id === selectedRecordId); setEditingRecordId(selectedRecordId); setEditingNote(record?.note ?? ""); setLastInput(chart.input); setTab("input"); }}
          onOpenSettings={() => setTab("settings")}
        />
      ) : <ArchiveScreen records={records} onDelete={deleteRecord} onOpen={openRecord} />;
    }
    return <SettingsScreen settings={settings} onChange={updateSettings} />;
  }, [chart, deleteRecord, editingNote, editingRecordId, lastInput, openRecord, records, selectedRecordId, settings, submitInput, tab, updateSettings]);

  const screenTransitionKey = `${tab}:${chart ? selectedRecordId ?? "chart" : "root"}:${editingRecordId ?? "view"}`;

  return (
    <SafeAreaProvider>
      <GlassPreferencesProvider reduceGlass={settings.reduceGlass}>
        <View style={styles.app}>
          <StatusBar style="dark" translucent={Platform.OS === "android"} />
          <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
            <ContentTransition key={screenTransitionKey} style={styles.screenTransition}>
              {currentScreen}
            </ContentTransition>
          </SafeAreaView>
          <SafeAreaView edges={[]} pointerEvents="box-none" style={styles.navSafeArea}>
            <BottomNav
              value={tab}
              onChange={(next) => {
                if (next === "input") startNew();
                else {
                  if (next === "archive") { setChart(null); setSelectedRecordId(null); }
                  setTab(next);
                }
              }}
            />
          </SafeAreaView>
        </View>
      </GlassPreferencesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: palette.background, overflow: "hidden" },
  safeArea: { flex: 1 },
  screenTransition: { flex: 1 },
  // iPhone 15 Plus is 430pt wide; the reference capsule leaves about 20pt
  // on each side. Use an explicit width so the native view's intrinsic size
  // cannot collapse the bar back to a small centered strip.
  navSafeArea: { position: "absolute", width: 430, height: 88, alignSelf: "center", bottom: 10 },
});
