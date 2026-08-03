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
  type Element,
  type Pillar,
} from "@/lib/bazi";
import { clearChartRecords, loadChartInput } from "@/lib/chart-storage";
import { GlassCard, GlassPanel, SecondaryButton } from "../ui";
import { ExportActions } from "./export-actions";
import { ElementText, PillarText } from "./element-text";
import { PillarTable } from "./pillar-table";
import { RelationBadges } from "./relation-badges";

type View =
  | "natal"
  | "luck"
  | "year"
  | "month"
  | "day"
  | "hour"
  | "relations"
  | "elements"
  | "export";
const VIEWS: Array<{ id: View; label: string }> = [
  { id: "natal", label: "原局" },
  { id: "luck", label: "大运" },
  { id: "year", label: "流年" },
  { id: "month", label: "流月" },
  { id: "day", label: "流日" },
  { id: "hour", label: "流时" },
  { id: "relations", label: "干支关系" },
  { id: "elements", label: "五行统计" },
  { id: "export", label: "导出" },
];

function validView(value: string | null): View {
  return VIEWS.some((view) => view.id === value) ? (value as View) : "natal";
}
function genderText(value: BirthInput["gender"]): string {
  return value === "male" ? "男" : value === "female" ? "女" : "未指定";
}

export function ChartClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [input, setInput] = useState<BirthInput | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>(() =>
    validView(searchParams.get("view")),
  );
  const [selectedYear, setSelectedYear] = useState(
    () => Number(searchParams.get("year")) || new Date().getFullYear(),
  );
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() =>
    Math.max(0, Math.min(11, Number(searchParams.get("month")) || 0)),
  );
  const [selectedDate, setSelectedDate] = useState(
    () => searchParams.get("date") ?? new Date().toISOString().slice(0, 10),
  );
  const [selectedLuckIndex, setSelectedLuckIndex] = useState(() =>
    Math.max(0, Number(searchParams.get("luck")) || 0),
  );
  const [anonymous, setAnonymous] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (!id) {
        setLoadError("链接中缺少本地命盘编号");
        return;
      }
      const value = loadChartInput(id);
      if (!value) {
        setLoadError(
          "未在本浏览器找到这张命盘。会话记录可能已清除，请重新填写出生信息。",
        );
        return;
      }
      setInput(value);
      setSelectedYear((current) =>
        Math.max(
          Math.max(1900, value.year - 1),
          Math.min(Math.min(2100, value.year + 120), current),
        ),
      );
    });
  }, [id]);

  const chartResult = useMemo<{
    chart: BaziChart | null;
    error: string | null;
  }>(() => {
    if (!input) return { chart: null, error: null };
    try {
      return { chart: calculateBaziChart(id, input), error: null };
    } catch (error) {
      return {
        chart: null,
        error: error instanceof Error ? error.message : "排盘计算失败",
      };
    }
  }, [id, input]);
  const chart = chartResult.chart;

  const natalPillars = useMemo(
    () =>
      chart?.pillars.filter((pillar): pillar is Pillar => pillar !== null) ??
      [],
    [chart],
  );
  const flowYears = useMemo(
    () =>
      chart
        ? generateFlowYears({
            startYear: Math.max(1900, chart.input.year - 1),
            endYear: Math.min(2100, chart.input.year + 120),
            birthYear: chart.input.year,
            birthMonth: chart.input.month,
            birthDay: chart.input.day,
            dayMaster: chart.dayMaster,
            natalPillars,
            luckCycle: chart.luckCycle,
          })
        : [],
    [chart, natalPillars],
  );
  const selectedFlowYear =
    flowYears.find((year) => year.year === selectedYear) ?? flowYears[0];
  const selectedLuck = chart?.luckCycle?.items[selectedLuckIndex];
  const yearContexts = useMemo(
    () => [...natalPillars, ...(selectedLuck ? [selectedLuck.pillar] : [])],
    [natalPillars, selectedLuck],
  );
  const flowMonths = useMemo(
    () =>
      chart && selectedFlowYear
        ? generateFlowMonths({
            year: selectedYear,
            timezone: chart.calendar.timezone,
            dayMaster: chart.dayMaster,
            contexts: [...yearContexts, selectedFlowYear.pillar],
          })
        : [],
    [chart, selectedYear, selectedFlowYear, yearContexts],
  );
  const selectedMonth = flowMonths[selectedMonthIndex] ?? flowMonths[0];
  const monthContexts = useMemo(
    () => [
      ...yearContexts,
      ...(selectedFlowYear ? [selectedFlowYear.pillar] : []),
      ...(selectedMonth ? [selectedMonth.pillar] : []),
    ],
    [yearContexts, selectedFlowYear, selectedMonth],
  );
  const flowDays = useMemo(
    () =>
      chart && selectedMonth
        ? generateFlowDays({
            month: selectedMonth,
            timezone: chart.calendar.timezone,
            dayMaster: chart.dayMaster,
            dayBoundaryRule: chart.input.dayBoundaryRule,
            contexts: monthContexts,
          })
        : [],
    [chart, selectedMonth, monthContexts],
  );
  const selectedFlowDay = useMemo(
    () =>
      chart
        ? generateFlowDay({
            date: selectedDate,
            dayMaster: chart.dayMaster,
            dayBoundaryRule: chart.input.dayBoundaryRule,
            contexts: monthContexts,
          })
        : null,
    [chart, selectedDate, monthContexts],
  );
  const flowHours = useMemo(
    () =>
      chart && selectedFlowDay
        ? generateFlowHours({
            date: selectedDate,
            dayMaster: chart.dayMaster,
            dayBoundaryRule: chart.input.dayBoundaryRule,
            contexts: [...monthContexts, selectedFlowDay.pillar],
          })
        : [],
    [chart, selectedDate, selectedFlowDay, monthContexts],
  );

  useEffect(() => {
    if (!chart) return;
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    url.searchParams.set("year", String(selectedYear));
    url.searchParams.set("month", String(selectedMonthIndex));
    url.searchParams.set("date", selectedDate);
    url.searchParams.set("luck", String(selectedLuckIndex));
    window.history.replaceState(null, "", url);
  }, [
    chart,
    view,
    selectedYear,
    selectedMonthIndex,
    selectedDate,
    selectedLuckIndex,
  ]);

  const activeError = loadError ?? chartResult.error;
  if (activeError)
    return (
      <div className="site-shell chart-layout">
        <GlassCard className="empty-state">
          <h1>无法恢复命盘</h1>
          <p className="muted">{activeError}</p>
          <Link className="button button-primary" href="/#chart-form">
            重新排盘
          </Link>
        </GlassCard>
      </div>
    );
  if (!chart)
    return (
      <div className="site-shell chart-layout">
        <GlassCard className="empty-state">
          <h1>正在本地排盘…</h1>
          <p className="muted">计算只在当前浏览器中进行。</p>
        </GlassCard>
      </div>
    );

  function changeYear(delta: number) {
    const next = Math.max(1900, Math.min(2100, selectedYear + delta));
    setSelectedYear(next);
  }
  function changeMonth(delta: number) {
    let nextMonth = selectedMonthIndex + delta;
    let nextYear = selectedYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    }
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setSelectedYear(Math.max(1900, Math.min(2100, nextYear)));
    setSelectedMonthIndex(nextMonth);
  }
  function syncDate(dateText: string) {
    const currentChart = chart;
    if (!currentChart) return;
    try {
      const date = Temporal.PlainDate.from(dateText);
      if (date.year < 1900 || date.year > 2100) return;
      setSelectedDate(date.toString());
      const noon = Temporal.ZonedDateTime.from({
        timeZone: currentChart.calendar.timezone,
        year: date.year,
        month: date.month,
        day: date.day,
        hour: 12,
      }).toInstant();
      for (const candidateYear of [date.year - 1, date.year]) {
        if (candidateYear < 1900 || candidateYear > 2100) continue;
        const candidates = generateFlowMonths({
          year: candidateYear,
          timezone: currentChart.calendar.timezone,
          dayMaster: currentChart.dayMaster,
          contexts: natalPillars,
        });
        const index = candidates.findIndex(
          (month) =>
            Temporal.Instant.compare(
              noon,
              Temporal.Instant.from(month.startInstant),
            ) >= 0 &&
            Temporal.Instant.compare(
              noon,
              Temporal.Instant.from(month.endInstant),
            ) < 0,
        );
        if (index >= 0) {
          setSelectedYear(candidateYear);
          setSelectedMonthIndex(index);
          break;
        }
      }
    } catch {
      /* 原生日期输入不会产生非法值 */
    }
  }
  function changeDay(delta: number) {
    syncDate(
      Temporal.PlainDate.from(selectedDate).add({ days: delta }).toString(),
    );
    setView("day");
  }
  function today() {
    if (!chart) return;
    const now = Temporal.Now.zonedDateTimeISO(chart.calendar.timezone);
    syncDate(now.toPlainDate().toString());
  }
  function clearAll() {
    clearChartRecords();
    window.location.assign("/#chart-form");
  }

  const basicRelations = [
    selectedFlowYear,
    selectedMonth,
    selectedFlowDay,
  ].flatMap((item) => item?.relations ?? []);
  return (
    <div className="site-shell chart-layout">
      <div className="chart-header">
        <div>
          <p className="chart-overline">
            {chart.calendar.location.city} · 本地命盘
          </p>
          <h1 className="chart-title">
            {anonymous ? "匿名命盘" : chart.input.name || "我的命盘"}
          </h1>
          <p className="chart-subtitle">
            <span>日主</span>
            <ElementText element={chart.pillars[2].stemElement}>
              {chart.dayMaster}
            </ElementText>
            <span>·</span>
            {chart.pillars.map((pillar, index) =>
              pillar ? (
                <PillarText pillar={pillar} key={pillar.label} />
              ) : (
                <span className="muted" key={index}>
                  时柱未知
                </span>
              ),
            )}
          </p>
        </div>
        <SecondaryButton className="no-print" type="button" onClick={clearAll}>
          清除记录
        </SecondaryButton>
      </div>
      <nav className="glass quick-nav no-print" aria-label="命盘功能导航">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            className={view === item.id ? "active" : ""}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div id="chart-export-target">
        {view === "natal" && (
          <>
            <GlassCard className="chart-section">
              <div className="chart-section__head">
                <h2>出生信息</h2>
              </div>
              <dl className="info-grid">
                <div className="info-item">
                  <dt>称呼</dt>
                  <dd>
                    {anonymous ? "匿名" : chart.input.name || "未填写"} ·{" "}
                    {genderText(chart.input.gender)}
                  </dd>
                </div>
                <div className="info-item">
                  <dt>公历</dt>
                  <dd>{chart.calendar.solarText}</dd>
                </div>
                <div className="info-item">
                  <dt>农历</dt>
                  <dd>{chart.calendar.lunarText}</dd>
                </div>
                <div className="info-item">
                  <dt>地点 / 时区</dt>
                  <dd>
                    {chart.calendar.location.city}
                    <br />
                    {chart.calendar.timezone} · {chart.calendar.utcOffset}
                  </dd>
                </div>
                <div className="info-item">
                  <dt>计算时刻</dt>
                  <dd>{chart.calendar.calculationText}</dd>
                </div>
                <div className="info-item">
                  <dt>胎元 / 命宫 / 身宫</dt>
                  <dd>
                    {chart.taiYuan} · {chart.mingGong} · {chart.shenGong}
                  </dd>
                </div>
              </dl>
              {chart.warnings.length > 0 && (
                <ul className="warning-list">
                  {chart.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </GlassCard>
            <GlassCard className="chart-section">
              <div className="chart-section__head">
                <h2>四柱命盘</h2>
                <span className="element-legend small">
                  <ElementText element="木">木</ElementText>
                  <ElementText element="火">火</ElementText>
                  <ElementText element="土">土</ElementText>
                  <ElementText element="金">金</ElementText>
                  <ElementText element="水">水</ElementText>
                </span>
              </div>
              <PillarTable chart={chart} />
            </GlassCard>
          </>
        )}

        {view === "elements" && (
          <GlassCard className="chart-section">
            <div className="chart-section__head">
              <h2>五行统计</h2>
            </div>
            <h3>明字</h3>
            <div className="stat-grid">
              {Object.entries(chart.fiveElements.visible).map(
                ([element, value]) => (
                  <div className="stat" key={element}>
                    <strong>{value}</strong>
                    <small>
                      <ElementText element={element as Element}>
                        {element}
                      </ElementText>
                    </small>
                  </div>
                ),
              )}
            </div>
            <h3>藏干加权</h3>
            <div className="stat-grid">
              {Object.entries(chart.fiveElements.weighted).map(
                ([element, value]) => (
                  <div className="stat" key={element}>
                    <strong>{value}</strong>
                    <small>
                      <ElementText element={element as Element}>
                        {element}
                      </ElementText>
                    </small>
                  </div>
                ),
              )}
            </div>
            <p className="small muted">仅作客观统计，不据此给出补益结论。</p>
          </GlassCard>
        )}

        {view === "luck" && (
          <GlassCard className="chart-section">
            <div className="chart-section__head">
              <h2>大运</h2>
            </div>
            {chart.luckCycle ? (
              <>
                <GlassPanel>
                  <strong>
                    {chart.luckCycle.forward ? "顺排" : "逆排"} ·{" "}
                    {chart.luckCycle.directionReason}
                  </strong>
                  <div className="small muted">
                    起运约 {chart.luckCycle.startAge.years} 年{" "}
                    {chart.luckCycle.startAge.months} 月{" "}
                    {chart.luckCycle.startAge.days} 日 ·{" "}
                    {chart.luckCycle.startDate}
                  </div>
                </GlassPanel>
                <div className="timeline" style={{ marginTop: 14 }}>
                  {chart.luckCycle.items.map((item) => (
                    <button
                      className={`timeline-card ${selectedLuckIndex === item.index ? "active" : ""}`}
                      key={item.index}
                      onClick={() => setSelectedLuckIndex(item.index)}
                    >
                      <strong>
                        <PillarText pillar={item.pillar} />
                      </strong>
                      <span>
                        {item.startYear}–{item.endYear}
                      </span>
                      <span>
                        {item.startAge}–{item.endAge} 岁{" "}
                        {item.isCurrent ? "· 当前" : ""}
                      </span>
                      <span>
                        {item.pillar.tenGod} · {item.pillar.naYin}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="disabled-note">性别未指定，未生成大运。</div>
            )}
          </GlassCard>
        )}

        {["year", "month", "day", "hour"].includes(view) && (
          <div className="control-bar glass no-print">
            <button onClick={today}>今天</button>
            <button onClick={() => changeYear(-1)}>上一年</button>
            <button onClick={() => changeYear(1)}>下一年</button>
            <button onClick={() => changeMonth(-1)}>上一月</button>
            <button onClick={() => changeMonth(1)}>下一月</button>
            <button onClick={() => changeDay(-1)}>上一天</button>
            <button onClick={() => changeDay(1)}>下一天</button>
            <button
              onClick={() => {
                today();
                setView("hour");
              }}
            >
              当前时辰
            </button>
            <input
              aria-label="自定义日期"
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              value={selectedDate}
              onChange={(event) => syncDate(event.target.value)}
            />
          </div>
        )}

        {view === "year" && (
          <GlassCard className="chart-section">
            <div className="chart-section__head">
              <h2>流年</h2>
            </div>
            <div className="year-grid">
              {flowYears.map((year) => (
                <button
                  className={`flow-card ${selectedYear === year.year ? "active" : ""}`}
                  key={year.year}
                  onClick={() => {
                    setSelectedYear(year.year);
                    setView("month");
                  }}
                >
                  <strong>{year.year}</strong>
                  <PillarText pillar={year.pillar} />
                  <small>
                    {year.fullAge} 岁 · 虚岁 {year.nominalAge}
                  </small>
                  <small>
                    {year.pillar.tenGod} · {year.pillar.naYin}
                  </small>
                </button>
              ))}
            </div>
            {selectedFlowYear && (
              <RelationBadges relations={selectedFlowYear.relations} />
            )}
          </GlassCard>
        )}

        {view === "month" && (
          <GlassCard className="chart-section">
            <div className="chart-section__head">
              <h2>{selectedYear} 流月</h2>
              <span className="small muted">按节气划分</span>
            </div>
            <div className="month-grid">
              {flowMonths.map((month, index) => (
                <button
                  className={`flow-card ${selectedMonthIndex === index ? "active" : ""}`}
                  key={month.id}
                  onClick={() => {
                    setSelectedMonthIndex(index);
                    const first = generateFlowDays({
                      month,
                      timezone: chart.calendar.timezone,
                      dayMaster: chart.dayMaster,
                      dayBoundaryRule: chart.input.dayBoundaryRule,
                      contexts: monthContexts,
                    })[0];
                    if (first) setSelectedDate(first.date);
                  }}
                >
                  <strong>
                    {month.name} · <PillarText pillar={month.pillar} />
                  </strong>
                  <small>
                    {month.startTerm} {month.startLocal}
                  </small>
                  <small>
                    至 {month.endTerm} {month.endLocal}
                  </small>
                  <span className="small">
                    {month.pillar.tenGod} · {month.pillar.naYin}
                  </span>
                </button>
              ))}
            </div>
            {selectedMonth && (
              <RelationBadges relations={selectedMonth.relations} />
            )}
          </GlassCard>
        )}

        {view === "day" && (
          <GlassCard className="chart-section">
            <div className="chart-section__head">
              <h2>流日 · {selectedDate}</h2>
            </div>
            {selectedFlowDay && (
              <GlassPanel>
                <strong className="pillar-gz">
                  <PillarText pillar={selectedFlowDay.pillar} />
                </strong>
                <span>
                  {" "}
                  · {selectedFlowDay.weekText} · {selectedFlowDay.lunarText} ·{" "}
                  {selectedMonth?.name}
                </span>
                <RelationBadges relations={selectedFlowDay.relations} />
              </GlassPanel>
            )}
            <div className="day-grid" style={{ marginTop: 14 }}>
              {flowDays.map((day) => (
                <button
                  className={`flow-card ${selectedDate === day.date ? "active" : ""}`}
                  key={day.date}
                  onClick={() => {
                    setSelectedDate(day.date);
                    setView("hour");
                  }}
                >
                  <strong>{day.date.slice(5)}</strong>
                  <PillarText pillar={day.pillar} />
                  <small>
                    {day.weekText} · {day.lunarText}
                  </small>
                </button>
              ))}
            </div>
          </GlassCard>
        )}

        {view === "hour" && (
          <GlassCard className="chart-section">
            <div className="chart-section__head">
              <h2>十二流时 · {selectedDate}</h2>
            </div>
            <div className="hour-grid">
              {flowHours.map((hour) => (
                <div className="flow-card" key={hour.index}>
                  <strong>
                    {hour.name} · <PillarText pillar={hour.pillar} />
                  </strong>
                  <small>{hour.timeRange}</small>
                  <span className="small">
                    {hour.pillar.tenGod} · {hour.pillar.branchTenGod}
                  </span>
                  <RelationBadges relations={hour.relations} limit={3} />
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {view === "relations" && (
          <GlassCard className="chart-section">
            <div className="chart-section__head">
              <h2>干支关系</h2>
            </div>
            <p>
              {selectedYear} {selectedFlowYear?.pillar.ganZhi} →{" "}
              {selectedMonth?.name} {selectedMonth?.pillar.ganZhi} →{" "}
              {selectedDate} {selectedFlowDay?.pillar.ganZhi}
            </p>
            <div className="relation-list">
              {basicRelations.map((relation, index) => (
                <span className="badge" key={`${relation.type}-${index}`}>
                  {relation.source} × {relation.target}：{relation.type}（
                  {relation.detail}）
                </span>
              ))}
            </div>
          </GlassCard>
        )}

        {view === "export" && (
          <>
            <GlassCard className="chart-section no-print">
              <div className="chart-section__head">
                <h2>导出</h2>
                <span className="small muted">全部免费</span>
              </div>
              <ExportActions
                chart={chart}
                targetId="export-document"
                anonymous={anonymous}
                setAnonymous={setAnonymous}
              />
            </GlassCard>
            <div id="export-document" className="export-document">
              <GlassCard className="chart-section">
                <div className="chart-section__head">
                  <div>
                    <h2>
                      元序 ·{" "}
                      {anonymous ? "匿名命盘" : chart.input.name || "我的命盘"}
                    </h2>
                    <span className="small muted" suppressHydrationWarning>
                      {new Date().toLocaleString("zh-CN")}
                    </span>
                  </div>
                </div>
                <dl className="info-grid">
                  <div className="info-item">
                    <dt>出生资料</dt>
                    <dd>
                      {chart.calendar.solarText}
                      <br />
                      {chart.calendar.lunarText}
                    </dd>
                  </div>
                  <div className="info-item">
                    <dt>地点 / 时区</dt>
                    <dd>
                      {chart.calendar.location.city} · {chart.calendar.timezone}
                    </dd>
                  </div>
                  <div className="info-item">
                    <dt>当前流运</dt>
                    <dd>
                      {selectedYear} {selectedFlowYear?.pillar.ganZhi}
                      <br />
                      {selectedMonth?.name} {selectedMonth?.pillar.ganZhi}
                      <br />
                      {selectedDate} {selectedFlowDay?.pillar.ganZhi}
                    </dd>
                  </div>
                </dl>
              </GlassCard>
              <GlassCard className="chart-section">
                <h2>四柱命盘</h2>
                <PillarTable chart={chart} />
              </GlassCard>
              <GlassCard className="chart-section">
                <h2>大运</h2>
                {chart.luckCycle ? (
                  <div className="timeline">
                    {chart.luckCycle.items.map((item) => (
                      <div className="timeline-card" key={item.index}>
                        <strong>
                          <PillarText pillar={item.pillar} />
                        </strong>
                        <span>
                          {item.startYear}–{item.endYear}
                        </span>
                        <span>
                          {item.startAge}–{item.endAge} 岁
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">性别未指定，未生成大运。</p>
                )}
              </GlassCard>
              <GlassCard className="chart-section">
                <h2>计算规则与声明</h2>
                <ul>
                  {chart.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
                <p className="small muted">
                  本工具基于传统民俗历法规则生成结果，仅供文化研究与娱乐参考。
                </p>
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
