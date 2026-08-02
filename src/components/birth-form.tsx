"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CITIES, birthInputSchema, type BirthInput } from "@/lib/bazi";
import { createChartId, saveChartInput } from "@/lib/chart-storage";
import { GlassCard, PrimaryButton, SegmentedControl } from "./ui";

const initialInput: BirthInput = {
  name: "", gender: "male", calendarType: "solar", year: 1990, month: 1, day: 1, isLeapMonth: false,
  timeKnown: true, hour: 12, minute: 0, locationId: "beijing", timeMode: "localStandard", dayBoundaryRule: "lateZiNextDay",
  showHiddenStems: true, showTenGods: true, showNaYin: true, showGrowth: true, showShenSha: false,
};

export function BirthForm() {
  const router = useRouter();
  const [input, setInput] = useState<BirthInput>(initialInput);
  const [persistent, setPersistent] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const update = <K extends keyof BirthInput>(key: K, value: BirthInput[K]) => setInput((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = birthInputSchema.safeParse(input);
    if (!result.success) {
      setErrors(result.error.issues.map((issue) => issue.message));
      return;
    }
    const id = createChartId();
    saveChartInput(id, result.data as BirthInput, persistent);
    router.push(`/chart?id=${encodeURIComponent(id)}`);
  }

  return (
    <GlassCard>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <div className="field"><label htmlFor="name">姓名或称呼（可选）</label><input id="name" className="input" value={input.name} maxLength={40} autoComplete="off" onChange={(e) => update("name", e.target.value)} placeholder="不填写也可以排盘" /></div>
          <div className="field"><span className="field-label">性别</span><SegmentedControl value={input.gender} label="性别" options={[{ value: "male", label: "男" }, { value: "female", label: "女" }, { value: "unspecified", label: "未指定" }]} onChange={(value) => update("gender", value)} /><span className="field-help">未指定时无法唯一确定大运顺逆，原局仍可正常排盘。</span></div>

          <div className="field field-full"><span className="field-label">历法类型</span><SegmentedControl value={input.calendarType} label="历法类型" options={[{ value: "solar", label: "公历" }, { value: "lunar", label: "农历" }]} onChange={(value) => update("calendarType", value)} /></div>
          <div className="field field-full">
            <label htmlFor="birth-year">出生日期</label>
            <div className="date-grid">
              <input id="birth-year" aria-label="出生年份" className="input" type="number" min="1900" max="2100" value={input.year} onChange={(e) => update("year", Number(e.target.value))} />
              <input aria-label="出生月份" className="input" type="number" min="1" max="12" value={input.month} onChange={(e) => update("month", Number(e.target.value))} />
              <input aria-label="出生日期" className="input" type="number" min="1" max={input.calendarType === "lunar" ? 30 : 31} value={input.day} onChange={(e) => update("day", Number(e.target.value))} />
            </div>
            {input.calendarType === "lunar" && <label className="check"><input type="checkbox" checked={input.isLeapMonth} onChange={(e) => update("isLeapMonth", e.target.checked)} />这是闰月</label>}
          </div>

          <div className="field">
            <label htmlFor="birth-hour">出生时间</label>
            <div className="time-grid"><input id="birth-hour" aria-label="出生小时" className="input" type="number" min="0" max="23" disabled={!input.timeKnown} value={input.hour} onChange={(e) => update("hour", Number(e.target.value))} /><input aria-label="出生分钟" className="input" type="number" min="0" max="59" disabled={!input.timeKnown} value={input.minute} onChange={(e) => update("minute", Number(e.target.value))} /></div>
            <label className="check"><input type="checkbox" checked={!input.timeKnown} onChange={(e) => update("timeKnown", !e.target.checked)} />不确定具体时间</label>
          </div>
          <div className="field"><label htmlFor="location">出生地点</label><select id="location" className="select" value={input.locationId} onChange={(e) => update("locationId", e.target.value)}>{CITIES.map((city) => <option value={city.id} key={city.id}>{city.country} · {city.city}（{city.timezone}）</option>)}</select><span className="field-help">静态城市数据包含经纬度与 IANA 时区；换算会处理历史夏令时。</span></div>

          <div className="field field-full"><span className="field-label">时间计算方式</span><SegmentedControl value={input.timeMode} label="时间计算方式" options={[{ value: "localStandard", label: "出生地当地民用时" }]} onChange={(value) => update("timeMode", value)} /><div className="disabled-note">真太阳时（实验）暂未开放：完整实现需同时处理经度差、均时差、时区与夏令时。在完成独立验证前不输出近似值。</div></div>

          <details className="field field-full"><summary className="field-label">高级选项与显示设置</summary><div className="check-row" style={{ marginTop: 14 }}>
            <label className="check"><input type="checkbox" checked={input.dayBoundaryRule === "lateZiNextDay"} onChange={(e) => update("dayBoundaryRule", e.target.checked ? "lateZiNextDay" : "midnight")} />23:00 起换日</label>
            <label className="check"><input type="checkbox" checked={input.showHiddenStems} onChange={(e) => update("showHiddenStems", e.target.checked)} />显示藏干</label>
            <label className="check"><input type="checkbox" checked={input.showTenGods} onChange={(e) => update("showTenGods", e.target.checked)} />显示十神</label>
            <label className="check"><input type="checkbox" checked={input.showNaYin} onChange={(e) => update("showNaYin", e.target.checked)} />显示纳音</label>
            <label className="check"><input type="checkbox" checked={input.showGrowth} onChange={(e) => update("showGrowth", e.target.checked)} />显示十二长生</label>
            <label className="check"><input type="checkbox" checked={input.showShenSha} onChange={(e) => update("showShenSha", e.target.checked)} />神煞（首版仅预留，暂不计算）</label>
          </div></details>

          <div className="field field-full"><label className="check"><input type="checkbox" checked={persistent} onChange={(e) => setPersistent(e.target.checked)} />我主动选择在此设备长期保存这张命盘</label><span className="field-help">默认仅在当前浏览会话保存，不上传服务器。勾选后才会写入 localStorage。</span></div>
          {errors.length > 0 && <div className="form-error field-full" role="alert">{errors.join("；")}</div>}
          <div className="field-full"><PrimaryButton type="submit" style={{ width: "100%" }}>生成免费命盘</PrimaryButton></div>
        </div>
      </form>
    </GlassCard>
  );
}
