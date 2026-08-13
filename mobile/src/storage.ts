import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BirthInput } from "../../src/lib/bazi";
import type { AppSettings, ChartRecord } from "./model";

const SETTINGS_KEY = "free-bazi:settings:v2";
const LAST_INPUT_KEY = "free-bazi:last-input:v1";
const ARCHIVE_KEY = "free-bazi:chart-archive:v1";

export async function loadSettings(): Promise<AppSettings | null> {
  const value = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!value) return null;
  const parsed = JSON.parse(value) as Partial<AppSettings>;
  return {
    dayBoundaryRule: parsed.dayBoundaryRule ?? "lateZiNextDay",
    reduceGlass: parsed.reduceGlass ?? false,
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadLastInput(): Promise<BirthInput | null> {
  const value = await AsyncStorage.getItem(LAST_INPUT_KEY);
  return value ? (JSON.parse(value) as BirthInput) : null;
}

export async function saveLastInput(input: BirthInput): Promise<void> {
  await AsyncStorage.setItem(LAST_INPUT_KEY, JSON.stringify(input));
}

export async function loadArchive(): Promise<ChartRecord[]> {
  const value = await AsyncStorage.getItem(ARCHIVE_KEY);
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed) ? (parsed as ChartRecord[]) : [];
}

export async function saveArchive(records: ChartRecord[]): Promise<void> {
  await AsyncStorage.setItem(ARCHIVE_KEY, JSON.stringify(records));
}
