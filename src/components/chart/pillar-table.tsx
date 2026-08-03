import type { BaziChart, Pillar } from "@/lib/bazi";
import { ElementText, StemText } from "./element-text";

export function PillarTable({ chart }: { chart: BaziChart }) {
  const pillars = chart.pillars;
  const rows: Array<{
    label: string;
    visible: boolean;
    render: (pillar: Pillar) => React.ReactNode;
  }> = [
    {
      label: "天干",
      visible: true,
      render: (pillar) => (
        <ElementText element={pillar.stemElement} className="pillar-gz">
          {pillar.stem}
        </ElementText>
      ),
    },
    {
      label: "地支",
      visible: true,
      render: (pillar) => (
        <ElementText element={pillar.branchElement} className="pillar-gz">
          {pillar.branch}
        </ElementText>
      ),
    },
    {
      label: "天干属性",
      visible: true,
      render: (pillar) => (
        <>
          <ElementText element={pillar.stemElement}>
            {pillar.stemElement}
          </ElementText>{" "}
          · {pillar.stemYinYang}
        </>
      ),
    },
    {
      label: "地支属性",
      visible: true,
      render: (pillar) => (
        <>
          <ElementText element={pillar.branchElement}>
            {pillar.branchElement}
          </ElementText>{" "}
          · {pillar.branchYinYang}
        </>
      ),
    },
    {
      label: "十神",
      visible: chart.input.showTenGods,
      render: (pillar) => (
        <>
          {pillar.tenGod}
          <br />
          <span className="small muted">支主气：{pillar.branchTenGod}</span>
        </>
      ),
    },
    {
      label: "藏干",
      visible: chart.input.showHiddenStems,
      render: (pillar) => (
        <span className="hidden-list">
          {pillar.hiddenStems.map((hidden) => (
            <span key={hidden.stem}>
              <StemText stem={hidden.stem} /> · {hidden.tenGod}{" "}
              <span className="muted">{Math.round(hidden.weight * 100)}%</span>
            </span>
          ))}
        </span>
      ),
    },
    {
      label: "纳音",
      visible: chart.input.showNaYin,
      render: (pillar) => pillar.naYin,
    },
    {
      label: "十二长生",
      visible: chart.input.showGrowth,
      render: (pillar) => pillar.growth,
    },
    { label: "空亡", visible: true, render: (pillar) => pillar.voidBranches },
  ];
  return (
    <div className="pillar-table-wrap">
      <table className="pillar-table">
        <thead>
          <tr>
            <th scope="col">项目</th>
            {pillars.map((pillar, index) => (
              <th scope="col" key={pillar?.label ?? index}>
                {pillar?.label ?? "时柱"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows
            .filter((row) => row.visible)
            .map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {pillars.map((pillar, index) => (
                  <td key={`${row.label}-${index}`}>
                    {pillar ? (
                      row.render(pillar)
                    ) : (
                      <span className="empty-pillar">
                        时刻未知
                        <br />
                        不生成
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
