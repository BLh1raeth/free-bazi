import { branchElement } from "./five-elements";
import { HIDDEN_STEMS } from "./hidden-stems";
import { getTenGod, stemElement, stemYinYang } from "./ten-gods";
import { BRANCHES, STEMS, type Branch, type Pillar, type Stem } from "./types";

const NA_YIN = [
  "海中金", "炉中火", "大林木", "路旁土", "剑锋金", "山头火", "涧下水", "城头土", "白蜡金", "杨柳木",
  "泉中水", "屋上土", "霹雳火", "松柏木", "长流水", "沙中金", "山下火", "平地木", "壁上土", "金箔金",
  "覆灯火", "天河水", "大驿土", "钗钏金", "桑柘木", "大溪水", "沙中土", "天上火", "石榴木", "大海水",
] as const;

const GROWTH_STAGES = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"] as const;
const GROWTH_START: Record<Stem, Branch> = { 甲: "亥", 乙: "午", 丙: "寅", 丁: "酉", 戊: "寅", 己: "酉", 庚: "巳", 辛: "子", 壬: "申", 癸: "卯" };
const VOID_BY_XUN = ["戌亥", "申酉", "午未", "辰巳", "寅卯", "子丑"] as const;

export function parseGanZhi(ganZhi: string): { stem: Stem; branch: Branch } {
  const stem = ganZhi[0];
  const branch = ganZhi[1];
  if (!STEMS.includes(stem as Stem) || !BRANCHES.includes(branch as Branch)) throw new Error(`无效干支：${ganZhi}`);
  return { stem: stem as Stem, branch: branch as Branch };
}

export function getCycleIndex(ganZhi: string): number {
  const { stem, branch } = parseGanZhi(ganZhi);
  const index = Array.from({ length: 60 }, (_, i) => i).find((i) => STEMS[i % 10] === stem && BRANCHES[i % 12] === branch);
  if (index === undefined) throw new Error(`干支不在六十甲子中：${ganZhi}`);
  return index;
}

export function shiftGanZhi(ganZhi: string, amount: number): string {
  const next = (getCycleIndex(ganZhi) + amount + 600) % 60;
  return `${STEMS[next % 10]}${BRANCHES[next % 12]}`;
}

export function getNaYin(ganZhi: string): string {
  return NA_YIN[Math.floor(getCycleIndex(ganZhi) / 2)] ?? "未知";
}

export function getGrowth(dayMaster: Stem, branch: Branch): string {
  const start = BRANCHES.indexOf(GROWTH_START[dayMaster]);
  const current = BRANCHES.indexOf(branch);
  const isYang = STEMS.indexOf(dayMaster) % 2 === 0;
  const index = isYang ? (current - start + 12) % 12 : (start - current + 12) % 12;
  return GROWTH_STAGES[index] ?? "未知";
}

export function getVoidBranches(ganZhi: string): string {
  return VOID_BY_XUN[Math.floor(getCycleIndex(ganZhi) / 10)] ?? "";
}

export function createPillar(level: Pillar["level"], label: string, ganZhi: string, dayMaster: Stem): Pillar {
  const { stem, branch } = parseGanZhi(ganZhi);
  const hiddenStems = HIDDEN_STEMS[branch].map((item) => ({ ...item, tenGod: getTenGod(dayMaster, item.stem) }));
  return {
    level,
    label,
    ganZhi,
    stem,
    branch,
    stemElement: stemElement(stem),
    branchElement: branchElement(branch),
    stemYinYang: stemYinYang(stem),
    branchYinYang: BRANCHES.indexOf(branch) % 2 === 0 ? "阳" : "阴",
    tenGod: label === "日柱" ? "日主" : getTenGod(dayMaster, stem),
    branchTenGod: hiddenStems[0]?.tenGod ?? "",
    hiddenStems,
    naYin: getNaYin(ganZhi),
    growth: getGrowth(dayMaster, branch),
    voidBranches: getVoidBranches(ganZhi),
  };
}
