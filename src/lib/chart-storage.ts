import type { BirthInput } from "./bazi";

const PREFIX = "qinglan:chart:";

export function createChartId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
export function saveChartInput(id: string, input: BirthInput, persistent: boolean): void {
  const value = JSON.stringify(input);
  sessionStorage.setItem(`${PREFIX}${id}`, value);
  if (persistent) localStorage.setItem(`${PREFIX}${id}`, value);
}
export function loadChartInput(id: string): BirthInput | null {
  const value = sessionStorage.getItem(`${PREFIX}${id}`) ?? localStorage.getItem(`${PREFIX}${id}`);
  return value ? JSON.parse(value) as BirthInput : null;
}
export function clearChartRecords(): void {
  for (const storage of [sessionStorage, localStorage]) {
    for (let i = storage.length - 1; i >= 0; i -= 1) {
      const key = storage.key(i);
      if (key?.startsWith(PREFIX)) storage.removeItem(key);
    }
  }
}
