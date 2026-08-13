import { BRANCHES, STEMS, type Branch, type Pillar, type ShenSha, type Stem } from "./types";

export const SHEN_SHA_STANDARD = {
  id: "sanming-common-v3",
  name: "三命通会常用神煞表 v3",
  method:
    "日干、月支、年日支、年柱及日柱按固定表诀查取；完整列出本版本全部命中，不作吉凶判断",
  sources: [
    "https://zh.wikisource.org/zh/三命通會/卷二",
    "https://zh.wikisource.org/zh/三命通會/卷三",
    "https://zh.wikisource.org/wiki/選擇紀要/上編",
    "https://zh.wikisource.org/zh-hans/星學大成_(四庫全書本)/卷01",
  ],
} as const;

export const SHEN_SHA_CATALOG = [
  "天乙贵人", "禄神", "金舆", "文昌贵人", "太极贵人", "文星贵人", "天印贵人", "红艳煞", "阳刃",
  "天德贵人", "月德贵人", "天德合", "月德合", "德秀贵人", "天医",
  "驿马", "华盖", "将星", "劫煞", "亡神", "灾煞", "六厄", "咸池",
  "红鸾", "天喜", "孤辰", "寡宿", "丧门", "吊客", "官符", "病符", "死符", "天罗", "地网",
  "阴阳差错", "八专", "九丑", "孤鸾", "魁罡",
] as const;

type StemRule = { targets: readonly Branch[]; verse: string };

const TIAN_YI: Record<Stem, StemRule> = {
  甲: { targets: ["丑", "未"], verse: "甲戊庚牛羊" },
  乙: { targets: ["子", "申"], verse: "乙己鼠猴乡" },
  丙: { targets: ["亥", "酉"], verse: "丙丁猪鸡位" },
  丁: { targets: ["亥", "酉"], verse: "丙丁猪鸡位" },
  戊: { targets: ["丑", "未"], verse: "甲戊庚牛羊" },
  己: { targets: ["子", "申"], verse: "乙己鼠猴乡" },
  庚: { targets: ["丑", "未"], verse: "甲戊庚牛羊" },
  辛: { targets: ["午", "寅"], verse: "六辛逢马虎" },
  壬: { targets: ["卯", "巳"], verse: "壬癸兔蛇藏" },
  癸: { targets: ["卯", "巳"], verse: "壬癸兔蛇藏" },
};

const LU_SHEN: Record<Stem, Branch> = {
  甲: "寅", 乙: "卯", 丙: "巳", 丁: "午", 戊: "巳",
  己: "午", 庚: "申", 辛: "酉", 壬: "亥", 癸: "子",
};

const WEN_CHANG: Record<Stem, Branch> = {
  甲: "巳", 乙: "午", 丙: "申", 丁: "酉", 戊: "申",
  己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯",
};

const TAI_JI: Record<Stem, readonly Branch[]> = {
  甲: ["子", "午"], 乙: ["子", "午"], 丙: ["卯", "酉"], 丁: ["卯", "酉"],
  戊: ["辰", "戌", "丑", "未"], 己: ["辰", "戌", "丑", "未"],
  庚: ["寅", "亥"], 辛: ["寅", "亥"], 壬: ["巳", "申"], 癸: ["巳", "申"],
};

const WEN_XING: Record<Stem, Branch> = {
  甲: "午", 乙: "巳", 丙: "申", 丁: "酉", 戊: "申",
  己: "酉", 庚: "戌", 辛: "亥", 壬: "寅", 癸: "卯",
};

const TIAN_YIN: Record<Stem, Branch> = {
  甲: "寅", 乙: "亥", 丙: "戌", 丁: "酉", 戊: "申",
  己: "未", 庚: "午", 辛: "巳", 壬: "辰", 癸: "卯",
};

const HONG_YAN: Record<Stem, Branch> = {
  甲: "午", 乙: "午", 丙: "寅", 丁: "未", 戊: "子",
  己: "辰", 庚: "戌", 辛: "酉", 壬: "巳", 癸: "申",
};

const YANG_REN: Partial<Record<Stem, Branch>> = {
  甲: "卯", 丙: "午", 戊: "午", 庚: "酉", 壬: "子",
};

type TianDeTarget = { stem?: Stem; branch?: Branch; traditional: string };

const TIAN_DE: Record<Branch, TianDeTarget> = {
  寅: { stem: "丁", traditional: "正月丁" },
  卯: { branch: "申", traditional: "二月坤（申）" },
  辰: { stem: "壬", traditional: "三月壬" },
  巳: { stem: "辛", traditional: "四月辛" },
  午: { branch: "亥", traditional: "五月乾（亥）" },
  未: { stem: "甲", traditional: "六月甲" },
  申: { stem: "癸", traditional: "七月癸" },
  酉: { branch: "寅", traditional: "八月艮（寅）" },
  戌: { stem: "丙", traditional: "九月丙" },
  亥: { stem: "乙", traditional: "十月乙" },
  子: { branch: "巳", traditional: "十一月巽（巳）" },
  丑: { stem: "庚", traditional: "十二月庚" },
};

const TIAN_DE_HE: Partial<Record<Branch, Stem>> = {
  寅: "壬", 辰: "丁", 巳: "丙", 未: "己", 申: "戊", 戌: "辛", 亥: "庚", 丑: "乙",
};

const YUE_DE: Array<{ group: string; target: Stem }> = [
  { group: "寅午戌", target: "丙" },
  { group: "亥卯未", target: "甲" },
  { group: "申子辰", target: "壬" },
  { group: "巳酉丑", target: "庚" },
];

type TriadRule = {
  group: string;
  element: "木" | "火" | "金" | "水";
  驿马: Branch;
  华盖: Branch;
  将星: Branch;
  劫煞: Branch;
  亡神: Branch;
  咸池: Branch;
  灾煞: Branch;
  六厄: Branch;
};

const TRIAD_RULES: TriadRule[] = [
  { group: "申子辰", element: "水", 驿马: "寅", 华盖: "辰", 将星: "子", 劫煞: "巳", 亡神: "亥", 咸池: "酉", 灾煞: "午", 六厄: "卯" },
  { group: "寅午戌", element: "火", 驿马: "申", 华盖: "戌", 将星: "午", 劫煞: "亥", 亡神: "巳", 咸池: "卯", 灾煞: "子", 六厄: "酉" },
  { group: "亥卯未", element: "木", 驿马: "巳", 华盖: "未", 将星: "卯", 劫煞: "申", 亡神: "寅", 咸池: "子", 灾煞: "酉", 六厄: "午" },
  { group: "巳酉丑", element: "金", 驿马: "亥", 华盖: "丑", 将星: "酉", 劫煞: "寅", 亡神: "申", 咸池: "午", 灾煞: "卯", 六厄: "子" },
];

const SEASON_RULES = [
  { group: "寅卯辰", 孤辰: "巳", 寡宿: "丑" },
  { group: "巳午未", 孤辰: "申", 寡宿: "辰" },
  { group: "申酉戌", 孤辰: "亥", 寡宿: "未" },
  { group: "亥子丑", 孤辰: "寅", 寡宿: "戌" },
] as const;

const DE_XIU_RULES: Array<{ group: string; 德: readonly Stem[]; 秀: readonly Stem[] }> = [
  { group: "寅午戌", 德: ["丙", "丁"], 秀: ["戊", "癸"] },
  { group: "申子辰", 德: ["壬", "癸", "戊", "己"], 秀: ["丙", "辛", "甲", "己"] },
  { group: "巳酉丑", 德: ["庚", "辛"], 秀: ["乙", "庚"] },
  { group: "亥卯未", 德: ["甲", "乙"], 秀: ["丁", "壬"] },
];

const YIN_YANG_ERROR_DAYS = new Set(["丙子", "丁丑", "戊寅", "辛卯", "壬辰", "癸巳", "丙午", "丁未", "戊申", "辛酉", "壬戌", "癸亥"]);
const BA_ZHUAN_DAYS = new Set(["甲寅", "乙卯", "己未", "丁未", "庚申", "辛酉", "戊戌", "癸丑"]);
const JIU_CHOU_DAYS = new Set(["壬子", "壬午", "戊子", "戊午", "己酉", "己卯", "乙卯", "辛酉", "辛卯"]);
const GU_LUAN_DAYS = new Set(["乙巳", "丁巳", "辛亥", "戊申", "甲寅", "丙午", "戊午", "壬子"]);
const KUI_GANG_DAYS = new Set(["庚辰", "庚戌", "壬辰", "戊戌"]);

export function shiftBranch(branch: Branch, amount: number): Branch {
  return BRANCHES[(BRANCHES.indexOf(branch) + amount + 120) % 12]!;
}

function addHit(
  hits: Map<string, ShenSha>,
  name: string,
  target: Pillar,
  basis: string,
  rule: string,
) {
  const key = `${name}|${target.label}|${target.branch}`;
  const existing = hits.get(key);
  if (existing) {
    if (!existing.basis.includes(basis)) existing.basis += `；${basis}`;
    return;
  }
  hits.set(key, {
    name,
    targetPillar: target.label,
    targetBranch: target.branch,
    basis,
    rule,
    standardId: SHEN_SHA_STANDARD.id,
  });
}

/**
 * 版本化的常用神煞查表。函数只回答“按本版本表诀是否命中”，不输出吉凶。
 * 新增项目必须先补规则文档与覆盖整张映射表的测试。
 */
export function calculateShenSha(
  pillars: ReadonlyArray<Pillar | null>,
  targets?: ReadonlyArray<Pillar | null>,
): ShenSha[] {
  const values = (targets ?? pillars).filter((pillar): pillar is Pillar => pillar !== null);
  const year = pillars[0] ?? null;
  const month = pillars[1] ?? null;
  const day = pillars[2] ?? null;
  if (!day) return [];

  const hits = new Map<string, ShenSha>();
  const tianYiRule = TIAN_YI[day.stem];
  const jinYu = shiftBranch(LU_SHEN[day.stem], 2);
  const yangRen = YANG_REN[day.stem];

  for (const target of values) {
    if (tianYiRule.targets.includes(target.branch)) {
      addHit(hits, "天乙贵人", target, `日干${day.stem}`, tianYiRule.verse);
    }
    if (target.branch === LU_SHEN[day.stem]) {
      addHit(hits, "禄神", target, `日干${day.stem}`, `${day.stem}禄在${LU_SHEN[day.stem]}`);
    }
    if (target.branch === jinYu) {
      addHit(hits, "金舆", target, `日干${day.stem}`, `${day.stem}禄前二辰为${jinYu}`);
    }
    if (target.branch === WEN_CHANG[day.stem]) {
      addHit(hits, "文昌贵人", target, `日干${day.stem}`, `${day.stem}见${WEN_CHANG[day.stem]}`);
    }
    if (TAI_JI[day.stem].includes(target.branch)) {
      addHit(hits, "太极贵人", target, `日干${day.stem}`, `${day.stem}见${target.branch}`);
    }
    if (target.branch === WEN_XING[day.stem]) {
      addHit(hits, "文星贵人", target, `日干${day.stem}`, `${day.stem}见${target.branch}`);
    }
    if (target.branch === TIAN_YIN[day.stem]) {
      addHit(hits, "天印贵人", target, `日干${day.stem}`, `${day.stem}见${target.branch}`);
    }
    if (target.branch === HONG_YAN[day.stem]) {
      addHit(hits, "红艳煞", target, `日干${day.stem}`, `${day.stem}见${target.branch}`);
    }
    if (yangRen && target.branch === yangRen) {
      addHit(hits, "阳刃", target, `日干${day.stem}`, `${day.stem}禄前一辰为${yangRen}`);
    }
  }

  if (month) {
    const tianDe = TIAN_DE[month.branch];
    const yueDe = YUE_DE.find((candidate) => candidate.group.includes(month.branch))!;
    const deXiu = DE_XIU_RULES.find((candidate) => candidate.group.includes(month.branch))!;
    const yueDeHe = STEMS[(STEMS.indexOf(yueDe.target) + 5) % 10]!;
    for (const target of values) {
      if (target.stem === tianDe.stem || target.branch === tianDe.branch) {
        addHit(hits, "天德贵人", target, `月支${month.branch}`, tianDe.traditional);
      }
      if (target.stem === yueDe.target) {
        addHit(hits, "月德贵人", target, `月支${month.branch}`, `${yueDe.group}月见${yueDe.target}`);
      }
      if (target.stem === yueDeHe) {
        addHit(hits, "月德合", target, `月支${month.branch}`, `${yueDe.target}之合干为${yueDeHe}`);
      }
      const tianDeHe = TIAN_DE_HE[month.branch];
      if (tianDeHe && target.stem === tianDeHe) addHit(hits, "天德合", target, `月支${month.branch}`, `${month.branch}月天德合干${tianDeHe}`);
      // 德秀贵人是组合格，不可把“德”“秀”两个集合分别作为单字神煞宽泛命中。
      // 月令对应的德、秀两组干必须在命局/所选时运柱组中同时出现，才在参与柱上列出。
    }
    const presentStems = new Set(values.map((pillar) => pillar.stem));
    const hasDeXiuCombination = deXiu.德.some((stem) => presentStems.has(stem)) && deXiu.秀.some((stem) => presentStems.has(stem));
    if (hasDeXiuCombination) {
      for (const target of values) {
        if (deXiu.德.includes(target.stem) || deXiu.秀.includes(target.stem)) {
          addHit(hits, "德秀贵人", target, `月支${month.branch}`, `${deXiu.group}月德秀两组干俱见`);
        }
      }
    }
    const tianYiTarget = shiftBranch(month.branch, -1);
    for (const target of values) {
      if (target.branch === tianYiTarget) addHit(hits, "天医", target, `月支${month.branch}`, `${month.branch}月见前一支${tianYiTarget}`);
    }
  }

  for (const basisPillar of [year, day]) {
    if (!basisPillar) continue;
    const triad = TRIAD_RULES.find((candidate) => candidate.group.includes(basisPillar.branch));
    if (!triad) continue;
    for (const name of ["驿马", "华盖", "将星", "劫煞", "亡神", "灾煞", "六厄"] as const) {
      for (const target of values) {
        if (target.branch === triad[name]) {
          addHit(hits, name, target, `${basisPillar.label}${basisPillar.branch}`, `${triad.group}见${triad[name]}`);
        }
      }
    }
    for (const target of values) {
      if (target.branch === triad.咸池) {
        addHit(hits, "咸池", target, `${basisPillar.label}${basisPillar.branch}`, `${triad.group}见${triad.咸池}`);
      }
    }
  }

  if (year) {
    const redLuan = shiftBranch("卯", -BRANCHES.indexOf(year.branch));
    const tianXi = shiftBranch(redLuan, 6);
    const season = SEASON_RULES.find((candidate) => candidate.group.includes(year.branch))!;
    const sangMen = shiftBranch(year.branch, 2);
    const diaoKe = shiftBranch(year.branch, -2);
    const guanFu = shiftBranch(year.branch, 5);
    const bingFu = shiftBranch(year.branch, -1);
    const siFu = shiftBranch(bingFu, 6);
    for (const target of values) {
      if (target.branch === redLuan) {
        addHit(hits, "红鸾", target, `年支${year.branch}`, `${year.branch}年红鸾在${redLuan}`);
      }
      if (target.branch === tianXi) {
        addHit(hits, "天喜", target, `年支${year.branch}`, `${year.branch}年天喜在${tianXi}`);
      }
      if (target.branch === season.孤辰) addHit(hits, "孤辰", target, `年支${year.branch}`, `${season.group}见${season.孤辰}`);
      if (target.branch === season.寡宿) addHit(hits, "寡宿", target, `年支${year.branch}`, `${season.group}见${season.寡宿}`);
      if (target.branch === sangMen) addHit(hits, "丧门", target, `年支${year.branch}`, `命前二辰${sangMen}`);
      if (target.branch === diaoKe) addHit(hits, "吊客", target, `年支${year.branch}`, `命后二辰${diaoKe}`);
      if (target.branch === guanFu) addHit(hits, "官符", target, `年支${year.branch}`, `太岁前五辰${guanFu}`);
      if (target.branch === bingFu) addHit(hits, "病符", target, `年支${year.branch}`, `太岁后一辰${bingFu}`);
      if (target.branch === siFu) addHit(hits, "死符", target, `年支${year.branch}`, `病符对冲${siFu}`);
    }

    const branches = new Set(values.map((pillar) => pillar.branch));
    if (branches.has("戌") && branches.has("亥")) {
      for (const target of values.filter((pillar) => pillar.branch === "戌" || pillar.branch === "亥")) addHit(hits, "天罗", target, "四柱见戌亥", "戌亥为天罗");
    }
    if (branches.has("辰") && branches.has("巳")) {
      for (const target of values.filter((pillar) => pillar.branch === "辰" || pillar.branch === "巳")) addHit(hits, "地网", target, "四柱见辰巳", "辰巳为地网");
    }
  }

  const dayOnly = values.find((pillar) => pillar.label === "日柱" || pillar.level === "day");
  if (dayOnly) {
    if (YIN_YANG_ERROR_DAYS.has(dayOnly.ganZhi)) addHit(hits, "阴阳差错", dayOnly, `日柱${dayOnly.ganZhi}`, "十二阴阳差错日");
    if (BA_ZHUAN_DAYS.has(dayOnly.ganZhi)) addHit(hits, "八专", dayOnly, `日柱${dayOnly.ganZhi}`, "八专日表");
    if (JIU_CHOU_DAYS.has(dayOnly.ganZhi)) addHit(hits, "九丑", dayOnly, `日柱${dayOnly.ganZhi}`, "九丑日表");
    if (GU_LUAN_DAYS.has(dayOnly.ganZhi)) addHit(hits, "孤鸾", dayOnly, `日柱${dayOnly.ganZhi}`, "孤鸾日表");
    if (KUI_GANG_DAYS.has(dayOnly.ganZhi)) addHit(hits, "魁罡", dayOnly, `日柱${dayOnly.ganZhi}`, "魁罡日表");
  }

  return [...hits.values()];
}

/** 以原局年、月、日为查法基准，计算大运、流年、流月、流日、流时的命中。 */
export function calculateTransitShenSha(
  natalPillars: ReadonlyArray<Pillar | null>,
  targets: ReadonlyArray<Pillar | null>,
): ShenSha[] {
  return calculateShenSha(natalPillars, targets);
}
