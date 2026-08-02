"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import {
  calculateBaziChart,
  generateFlowDay,
  generateFlowDays,
  generateFlowHours,
  generateFlowMonths,
  generateFlowYears,
  type BaziChart,
  type BirthInput,
  type Pillar,
} from "@/lib/bazi";
import { clearChartRecords, loadChartInput } from "@/lib/chart-storage";
import { GlassCard, GlassPanel, SecondaryButton } from "../ui";
import { ExportActions } from "./export-actions";
import { PillarTable } from "./pillar-table";
import { RelationBadges } from "./relation-badges";

type View = "natal" | "luck" | "year" | "month" | "day" | "hour" | "relations" | "elements" | "export";
const VIEWS: Array<{ id: View; label: string }> = [
  { id: "natal", label: "原局" }, { id: "luck", label: "大运" }, { id: "year", label: "流年" }, { id: "month", label: "流月" },
  { id: "day", label: "流日" }, { id: "hour", label: "流时" }, { id: "relations", label: "干支关系" }, { id: "elements", label: "五行统计" }, { id: "export", label: "导出" },
];

function validView(value: string | null): View { return VIEWS.some((view) => view.id === value) ? value as View : "natal"; }
function genderText(value: BirthInput["gender"]): string { return value === "male" ? "男" : value === "female" ? "女" : "未指定"; }

export function ChartClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [input, setInput] = useState<BirthInput | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>(() => validView(searchParams.get("view")));
  const [selectedYear, setSelectedYear] = useState(() => Number(searchParams.get("year")) || new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => Math.max(0, Math.min(11, Number(searchParams.get("month")) || 0)));
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get("date") ?? new Date().toISOString().slice(0, 10));
  const [selectedLuckIndex, setSelectedLuckIndex] = useState(() => Math.max(0, Number(searchParams.get("luck")) || 0));
  const [anonymous, setAnonymous] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (!id) { setLoadError("链接中缺少本地命盘编号"); return; }
      const value = loadChartInput(id);
      if (!value) { setLoadError("未在本浏览器找到这张命盘。会话记录可能已清除，请重新填写出生信息。"); return; }
      setInput(value);
      setSelectedYear((current) => Math.max(Math.max(1900, value.year - 1), Math.min(Math.min(2100, value.year + 120), current)));
    });
  }, [id]);

  const chartResult = useMemo<{ chart: BaziChart | null; error: string | null }>(() => {
    if (!input) return { chart: null, error: null };
    try { return { chart: calculateBaziChart(id, input), error: null }; }
    catch (error) { return { chart: null, error: error instanceof Error ? error.message : "排盘计算失败" }; }
  }, [id, input]);
  const chart = chartResult.chart;

  const natalPillars = useMemo(() => chart?.pillars.filter((pillar): pillar is Pillar => pillar !== null) ?? [], [chart]);
  const flowYears = useMemo(() => chart ? generateFlowYears({
    startYear: Math.max(1900, chart.input.year - 1), endYear: Math.min(2100, chart.input.year + 120),
    birthYear: chart.input.year, birthMonth: chart.input.month, birthDay: chart.input.day,
    dayMaster: chart.dayMaster, natalPillars, luckCycle: chart.luckCycle,
  }) : [], [chart, natalPillars]);
  const selectedFlowYear = flowYears.find((year) => year.year === selectedYear) ?? flowYears[0];
  const selectedLuck = chart?.luckCycle?.items[selectedLuckIndex];
  const yearContexts = useMemo(() => [...natalPillars, ...(selectedLuck ? [selectedLuck.pillar] : [])], [natalPillars, selectedLuck]);
  const flowMonths = useMemo(() => chart && selectedFlowYear ? generateFlowMonths({ year: selectedYear, timezone: chart.calendar.timezone, dayMaster: chart.dayMaster, contexts: [...yearContexts, selectedFlowYear.pillar] }) : [], [chart, selectedYear, selectedFlowYear, yearContexts]);
  const selectedMonth = flowMonths[selectedMonthIndex] ?? flowMonths[0];
  const monthContexts = useMemo(() => [...yearContexts, ...(selectedFlowYear ? [selectedFlowYear.pillar] : []), ...(selectedMonth ? [selectedMonth.pillar] : [])], [yearContexts, selectedFlowYear, selectedMonth]);
  const flowDays = useMemo(() => chart && selectedMonth ? generateFlowDays({ month: selectedMonth, timezone: chart.calendar.timezone, dayMaster: chart.dayMaster, dayBoundaryRule: chart.input.dayBoundaryRule, contexts: monthContexts }) : [], [chart, selectedMonth, monthContexts]);
  const selectedFlowDay = useMemo(() => chart ? generateFlowDay({ date: selectedDate, dayMaster: chart.dayMaster, dayBoundaryRule: chart.input.dayBoundaryRule, contexts: monthContexts }) : null, [chart, selectedDate, monthContexts]);
  const flowHours = useMemo(() => chart && selectedFlowDay ? generateFlowHours({ date: selectedDate, dayMaster: chart.dayMaster, dayBoundaryRule: chart.input.dayBoundaryRule, contexts: [...monthContexts, selectedFlowDay.pillar] }) : [], [chart, selectedDate, selectedFlowDay, monthContexts]);

  useEffect(() => {
    if (!chart) return;
    const url = new URL(window.location.href);
    url.searchParams.set("view", view); url.searchParams.set("year", String(selectedYear)); url.searchParams.set("month", String(selectedMonthIndex));
    url.searchParams.set("date", selectedDate); url.searchParams.set("luck", String(selectedLuckIndex));
    window.history.replaceState(null, "", url);
  }, [chart, view, selectedYear, selectedMonthIndex, selectedDate, selectedLuckIndex]);

  const activeError = loadError ?? chartResult.error;
  if (activeError) return <div className="site-shell chart-layout"><GlassCard className="empty-state"><h1>无法恢复命盘</h1><p className="muted">{activeError}</p><Link className="button button-primary" href="/#chart-form">重新排盘</Link></GlassCard></div>;
  if (!chart) return <div className="site-shell chart-layout"><GlassCard className="empty-state"><h1>正在本地排盘…</h1><p className="muted">计算只在当前浏览器中进行。</p></GlassCard></div>;

  function changeYear(delta: number) { const next = Math.max(1900, Math.min(2100, selectedYear + delta)); setSelectedYear(next); }
  function changeMonth(delta: number) {
    let nextMonth = selectedMonthIndex + delta; let nextYear = selectedYear;
    if (nextMonth < 0) { nextMonth = 11; nextYear -= 1; } if (nextMonth > 11) { nextMonth = 0; nextYear += 1; }
    setSelectedYear(Math.max(1900, Math.min(2100, nextYear))); setSelectedMonthIndex(nextMonth);
  }
  function syncDate(dateText: string) {
    const currentChart = chart;
    if (!currentChart) return;
    try {
      const date = Temporal.PlainDate.from(dateText);
      if (date.year < 1900 || date.year > 2100) return;
      setSelectedDate(date.toString());
      const noon = Temporal.ZonedDateTime.from({ timeZone: currentChart.calendar.timezone, year: date.year, month: date.month, day: date.day, hour: 12 }).toInstant();
      for (const candidateYear of [date.year - 1, date.year]) {
        if (candidateYear < 1900 || candidateYear > 2100) continue;
        const candidates = generateFlowMonths({ year: candidateYear, timezone: currentChart.calendar.timezone, dayMaster: currentChart.dayMaster, contexts: natalPillars });
        const index = candidates.findIndex((month) => Temporal.Instant.compare(noon, Temporal.Instant.from(month.startInstant)) >= 0 && Temporal.Instant.compare(noon, Temporal.Instant.from(month.endInstant)) < 0);
        if (index >= 0) { setSelectedYear(candidateYear); setSelectedMonthIndex(index); break; }
      }
    } catch { /* 原生日期输入不会产生非法值 */ }
  }
  function changeDay(delta: number) { syncDate(Temporal.PlainDate.from(selectedDate).add({ days: delta }).toString()); setView("day"); }
  function today() { if (!chart) return; const now = Temporal.Now.zonedDateTimeISO(chart.calendar.timezone); syncDate(now.toPlainDate().toString()); }
  function clearAll() { clearChartRecords(); window.location.assign("/#chart-form"); }

  const basicRelations = [selectedFlowYear, selectedMonth, selectedFlowDay].flatMap((item) => item?.relations ?? []);
  return <div className="site-shell chart-layout">
    <div className="chart-header"><div><p className="eyebrow">本地命盘 · {chart.calendar.location.city}</p><h1 className="chart-title">{anonymous ? "匿名命盘" : chart.input.name || "我的命盘"}</h1><p className="chart-subtitle">日主 {chart.dayMaster} · {chart.pillars.map((pillar) => pillar?.ganZhi ?? "时柱未知").join(" · ")}</p></div><SecondaryButton className="no-print" type="button" onClick={clearAll}>清除本地记录</SecondaryButton></div>
    <nav className="glass quick-nav no-print" aria-label="命盘功能导航">{VIEWS.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>{item.label}</button>)}</nav>
    <div id="chart-export-target">
      {view === "natal" && <><GlassCard className="chart-section"><div className="chart-section__head"><div><h2>基础信息</h2><span className="small muted">最终计算时间与时区均明确列出</span></div></div><dl className="info-grid">
        <div className="info-item"><dt>称呼 / 性别</dt><dd>{anonymous ? "匿名" : chart.input.name || "未填写"} · {genderText(chart.input.gender)}</dd></div>
        <div className="info-item"><dt>输入日期</dt><dd>{chart.calendar.inputCalendarText}</dd></div><div className="info-item"><dt>转换后公历</dt><dd>{chart.calendar.solarText}</dd></div>
        <div className="info-item"><dt>转换后农历</dt><dd>{chart.calendar.lunarText}</dd></div><div className="info-item"><dt>地点 / 时区</dt><dd>{chart.calendar.location.country} {chart.calendar.location.city}<br />{chart.calendar.timezone} · {chart.calendar.utcOffset}</dd></div>
        <div className="info-item"><dt>参与计算</dt><dd>{chart.calendar.calculationText}</dd></div><div className="info-item"><dt>真太阳时</dt><dd>未启用（首版不输出近似值）</dd></div><div className="info-item"><dt>胎元 / 命宫 / 身宫</dt><dd>{chart.taiYuan} · {chart.mingGong} · {chart.shenGong}</dd></div>
      </dl>{chart.warnings.length > 0 && <ul className="warning-list">{chart.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}</GlassCard>
      <GlassCard className="chart-section"><div className="chart-section__head"><div><h2>四柱命盘</h2><span className="small muted">时刻未知时不生成确定时柱</span></div></div><PillarTable chart={chart} /></GlassCard></>}

      {view === "elements" && <GlassCard className="chart-section"><div className="chart-section__head"><div><h2>五行统计</h2><span className="small muted">客观统计，不据此给出“缺什么补什么”的结论</span></div></div><h3>八字明字</h3><div className="stat-grid">{Object.entries(chart.fiveElements.visible).map(([element, value]) => <div className="stat" key={element}><strong>{value}</strong><small>{element}</small></div>)}</div><h3>含藏干加权</h3><div className="stat-grid">{Object.entries(chart.fiveElements.weighted).map(([element, value]) => <div className="stat" key={element}><strong>{value}</strong><small>{element}</small></div>)}</div><p className="small muted">口径：每个天干权重 1；地支按主气/中气/余气比例拆分，总权重 1。此统计不含旺衰、月令或调候判断。</p></GlassCard>}

      {view === "luck" && <GlassCard className="chart-section"><div className="chart-section__head"><div><h2>大运</h2><span className="small muted">至少十二步，可点击设为当前分析范围</span></div></div>{chart.luckCycle ? <><GlassPanel><strong>{chart.luckCycle.forward ? "顺排" : "逆排"} · {chart.luckCycle.directionReason}</strong><div className="small muted">起运约 {chart.luckCycle.startAge.years} 年 {chart.luckCycle.startAge.months} 月 {chart.luckCycle.startAge.days} 日；起运公历 {chart.luckCycle.startDate}</div><div className="small muted">{chart.luckCycle.rule}</div></GlassPanel><div className="timeline" style={{ marginTop: 14 }}>{chart.luckCycle.items.map((item) => <button className={`timeline-card ${selectedLuckIndex === item.index ? "active" : ""}`} key={item.index} onClick={() => setSelectedLuckIndex(item.index)}><strong>{item.pillar.ganZhi}</strong><span>{item.startYear}–{item.endYear}</span><span>{item.startAge}–{item.endAge} 岁 {item.isCurrent ? "· 当前" : ""}</span><span>{item.pillar.tenGod} · {item.pillar.naYin}</span></button>)}</div></> : <div className="disabled-note">性别未指定，无法根据“阴阳年干 + 性别”唯一确定大运顺逆，因此不生成可能误导的大运列表。</div>}</GlassCard>}

      {["year", "month", "day", "hour"].includes(view) && <div className="control-bar glass no-print"><button onClick={today}>今天</button><button onClick={() => changeYear(-1)}>上一年</button><button onClick={() => changeYear(1)}>下一年</button><button onClick={() => changeMonth(-1)}>上一月</button><button onClick={() => changeMonth(1)}>下一月</button><button onClick={() => changeDay(-1)}>上一天</button><button onClick={() => changeDay(1)}>下一天</button><button onClick={() => { today(); setView("hour"); }}>当前时辰</button><input aria-label="自定义日期" type="date" min="1900-01-01" max="2100-12-31" value={selectedDate} onChange={(event) => syncDate(event.target.value)} /></div>}

      {view === "year" && <GlassCard className="chart-section"><div className="chart-section__head"><div><h2>流年</h2><span className="small muted">一次批量生成支持范围内的长期流年；选择后才计算流月</span></div></div><div className="year-grid">{flowYears.map((year) => <button className={`flow-card ${selectedYear === year.year ? "active" : ""}`} key={year.year} onClick={() => { setSelectedYear(year.year); setView("month"); }}><strong>{year.year}</strong><span>{year.pillar.ganZhi}</span><small>周岁约 {year.fullAge} · 虚岁 {year.nominalAge}</small><small>{year.pillar.tenGod} · {year.pillar.naYin}</small></button>)}</div>{selectedFlowYear && <RelationBadges relations={selectedFlowYear.relations} />}</GlassCard>}

      {view === "month" && <GlassCard className="chart-section"><div className="chart-section__head"><div><h2>{selectedYear} 流月</h2><span className="small muted">按“节”划分，不按公历自然月</span></div></div><div className="month-grid">{flowMonths.map((month, index) => <button className={`flow-card ${selectedMonthIndex === index ? "active" : ""}`} key={month.id} onClick={() => { setSelectedMonthIndex(index); const first = generateFlowDays({ month, timezone: chart.calendar.timezone, dayMaster: chart.dayMaster, dayBoundaryRule: chart.input.dayBoundaryRule, contexts: monthContexts })[0]; if (first) setSelectedDate(first.date); }}><strong>{month.name} · {month.pillar.ganZhi}</strong><small>{month.startTerm} {month.startLocal}</small><small>至 {month.endTerm} {month.endLocal}</small><span className="small">{month.pillar.tenGod} · {month.pillar.naYin}</span></button>)}</div>{selectedMonth && <RelationBadges relations={selectedMonth.relations} />}</GlassCard>}

      {view === "day" && <GlassCard className="chart-section"><div className="chart-section__head"><div><h2>流日 · {selectedDate}</h2><span className="small muted">日历视图；点击日期后才生成流时</span></div></div>{selectedFlowDay && <GlassPanel><strong className="pillar-gz">{selectedFlowDay.pillar.ganZhi}</strong><span> · {selectedFlowDay.weekText} · {selectedFlowDay.lunarText} · {selectedMonth?.name}</span><RelationBadges relations={selectedFlowDay.relations} /></GlassPanel>}<div className="day-grid" style={{ marginTop: 14 }}>{flowDays.map((day) => <button className={`flow-card ${selectedDate === day.date ? "active" : ""}`} key={day.date} onClick={() => { setSelectedDate(day.date); setView("hour"); }}><strong>{day.date.slice(5)}</strong><span>{day.pillar.ganZhi}</span><small>{day.weekText} · {day.lunarText}</small></button>)}</div></GlassCard>}

      {view === "hour" && <GlassCard className="chart-section"><div className="chart-section__head"><div><h2>十二流时 · {selectedDate}</h2><span className="small muted">以 {chart.calendar.location.city} 当地民用时和当前换日规则计算</span></div></div><div className="hour-grid">{flowHours.map((hour) => <div className="flow-card" key={hour.index}><strong>{hour.name} · {hour.pillar.ganZhi}</strong><small>{hour.timeRange}</small><span className="small">{hour.pillar.tenGod} · {hour.pillar.branchTenGod}</span><RelationBadges relations={hour.relations} limit={3} /></div>)}</div></GlassCard>}

      {view === "relations" && <GlassCard className="chart-section"><div className="chart-section__head"><div><h2>干支关系</h2><span className="small muted">客观列示，不自动生成吉凶结论</span></div></div><p>当前层级：{selectedYear} {selectedFlowYear?.pillar.ganZhi} → {selectedMonth?.name} {selectedMonth?.pillar.ganZhi} → {selectedDate} {selectedFlowDay?.pillar.ganZhi}</p><div className="relation-list">{basicRelations.map((relation, index) => <span className="badge" key={`${relation.type}-${index}`}>{relation.source} × {relation.target}：{relation.type}（{relation.detail}）</span>)}</div><p className="small muted">已识别天干五合、同类、生克；地支六合、三合、三会、六冲、刑、自刑、六害与六破。多支关系仅在当前上下文完整出现时标记。</p></GlassCard>}

      {view === "export" && <><GlassCard className="chart-section no-print"><div className="chart-section__head"><div><h2>免费导出</h2><span className="small muted">复制、PNG、长图、PDF 与打印均无付费限制</span></div></div><ExportActions chart={chart} targetId="export-document" anonymous={anonymous} setAnonymous={setAnonymous} /></GlassCard>
      <div id="export-document" className="export-document">
        <GlassCard className="chart-section"><div className="chart-section__head"><div><h2>清岚排盘 · {anonymous ? "匿名命盘" : chart.input.name || "我的命盘"}</h2><span className="small muted" suppressHydrationWarning>生成时间：{new Date().toLocaleString("zh-CN")}</span></div></div><dl className="info-grid"><div className="info-item"><dt>出生资料</dt><dd>{chart.calendar.solarText}<br />{chart.calendar.lunarText}</dd></div><div className="info-item"><dt>地点 / 时区</dt><dd>{chart.calendar.location.city} · {chart.calendar.timezone}</dd></div><div className="info-item"><dt>当前流运</dt><dd>{selectedYear} {selectedFlowYear?.pillar.ganZhi}<br />{selectedMonth?.name} {selectedMonth?.pillar.ganZhi}<br />{selectedDate} {selectedFlowDay?.pillar.ganZhi}</dd></div></dl></GlassCard>
        <GlassCard className="chart-section"><h2>四柱命盘</h2><PillarTable chart={chart} /></GlassCard>
        <GlassCard className="chart-section"><h2>大运</h2>{chart.luckCycle ? <div className="timeline">{chart.luckCycle.items.map((item) => <div className="timeline-card" key={item.index}><strong>{item.pillar.ganZhi}</strong><span>{item.startYear}–{item.endYear}</span><span>{item.startAge}–{item.endAge} 岁</span></div>)}</div> : <p className="muted">性别未指定，未生成大运。</p>}</GlassCard>
        <GlassCard className="chart-section"><h2>计算规则与声明</h2><ul>{chart.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul><p className="small muted">本工具基于传统民俗历法规则生成结果，仅供文化研究与娱乐参考。</p></GlassCard>
      </div></>}

      <GlassCard className="chart-section"><div className="chart-section__head"><div><h2>当前计算规则</h2><span className="small muted">争议规则公开说明，不假装流派完全一致</span></div></div><ul>{chart.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul><a className="button button-quiet no-print" href="/rules">查看完整规则与限制</a></GlassCard>
    </div>
  </div>;
}
