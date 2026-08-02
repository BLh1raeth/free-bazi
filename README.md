# 清岚排盘

一个真正可运行、可测试、可部署的中文八字排盘网站 MVP。项目核心功能**永久免费**：无会员、无付费解锁、无排盘次数限制、无强制登录，原局、大运、流年、流月、流日、流时和导出均可直接使用。

> 本工具基于传统民俗历法规则生成结果，仅供文化研究与娱乐参考，不应作为医疗、法律、投资或人生重大决策依据。

## 当前已实现

- 公历 / 农历（含闰月）输入与互转，支持 1900–2100 年；
- 静态城市、经纬度、IANA 时区和历史夏令时；
- 立春精确换年、十二节精确换月、可配置 23:00 / 00:00 换日；
- 年、月、日、时四柱（时刻未知时不生成时柱）；
- 十神、藏干与藏干十神、纳音、十二长生、空亡、阴阳五行；
- 五行明字统计与藏干加权统计；
- 常见子平法大运顺逆、起运时间和十二步大运；
- 长期流年批量生成；选择流年后生成节令流月；选择流月后生成流日；选择日期后生成十二流时；
- 天干五合 / 生克 / 同类，地支六合 / 三合 / 三会 / 六冲 / 刑 / 自刑 / 六害 / 六破；
- 日期控制器：今天、上/下一年、上/下一月、上/下一天、当前时辰、自定义日期；
- URL 保存查看层级与日期，本地随机编号恢复出生资料，不在 URL 暴露完整信息；
- 复制、PNG / 长图、PDF、浏览器打印和匿名导出；
- 白蓝响应式液态玻璃设计，支持无模糊降级、减少动态、高对比度和打印样式；
- 首页、结果页、规则、隐私、关于、404、加载与错误状态；
- Web App Manifest（PWA 完整离线缓存仍在 P1）。

## 技术栈

- Next.js 16.2.12、React 19、App Router；
- TypeScript 6 strict；
- Tailwind CSS 4 + 原创 CSS Variables 设计系统；
- Zod 4；
- `lunar-typescript` 1.8.6（MIT）历法适配层；
- `@js-temporal/polyfill` 处理 IANA 时区 / DST；
- Vitest、Playwright、ESLint、Prettier；
- `html-to-image`、`jsPDF`（点击导出后动态加载）。

所有核心算法位于 `src/lib/bazi/`，React 组件不直接调用第三方历法库。

## 本地运行

要求 Node.js 20.9+，推荐 pnpm 10 或 11。

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:3000`。

## 质量检查

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm start
```

Playwright 默认使用本机稳定版 Chrome；CI 可把配置改为 Playwright Chromium 并先执行 `pnpm exec playwright install --with-deps chromium`。

## 环境变量

当前版本不需要环境变量，也不调用外部排盘或分析 API。`.env.example` 仅说明这一点，不包含密钥。

## 当前规则摘要

- 年柱以立春精确交接时刻换年；
- 月柱以十二“节”精确交接时刻换月；
- 默认晚子初 23:00 换日，可切换为当地 00:00 换日；
- 节令边界是全球同一瞬间，输入先由出生地 IANA 时区转为历法库使用的 GMT+8 基准；
- 大运顺逆按阴阳年干与性别；起运用相邻节令实时间隔按三天一岁折算；
- 出生时刻未知时，以当日中午暂定年/月边界但不生成时柱，并显示复核警告。

完整说明见 [docs/bazi-rules.md](docs/bazi-rules.md)。

## 历法依赖与模板

历法库评估见 [docs/calendar-library-evaluation.md](docs/calendar-library-evaluation.md)。采用的 `lunar-typescript` 使用 MIT License，项目保留其许可证义务。节气算法上游说明引用寿星天文历核心算法。

本项目没有复制 GitHub UI 模板：工程骨架和白蓝玻璃界面均为原创，因此无模板来源或模板许可证附加要求，也没有复制其他排盘网站或 Apple 的商标、图标、字体文件和受保护素材。

## 隐私设计

计算完全在浏览器端进行。提交后默认只写入 `sessionStorage`；只有用户主动勾选长期保存才写入 `localStorage`。URL 只包含随机本地编号和查看状态。详见 [docs/privacy-design.md](docs/privacy-design.md)。

## 已知限制（如实披露）

- 真太阳时尚未启用；不会用粗略经度修正冒充精确均时差结果；
- `lunar-typescript` 官方 API 以 GMT+8 为基准，本项目已对节令瞬间做 IANA 时区换算；海外古代历史时区仍应与专业历书复核；
- 胎元、命宫、身宫沿用依赖库常见公式，流派切换尚未实现；
- 神煞、小运、合盘未在规则文档和独立测试完成前开放；
- PWA 目前仅提供 Manifest，Service Worker 离线缓存属于 P1；
- 导出当前页面可见层级；更多排版模板属于 P2；
- 农历库支持范围可能大于产品范围，产品主动限制为 1900–2100 以匹配验证资料；
- 暂未声明 Lighthouse 的实测分数；已按性能与无障碍原则实现，部署后应在真实域名和设备上审计。

## 部署到 Vercel

1. 将仓库推送到 Git 服务；
2. 在 Vercel 导入项目；
3. Framework Preset 选择 Next.js；
4. Install Command 使用 `pnpm install`，Build Command 使用 `pnpm build`；
5. 当前无需配置环境变量；
6. 部署前运行完整质量检查。

## 后续计划

- P1：经过规则验证的常见神煞、小运、完整 PWA / 离线排盘、多命盘本地管理、日历视图增强；
- P2：合盘（先规则文档与测试）、多流派切换、多语言、更多导出模板和高级统计；
- 算法持续工作：增加更多权威历书交叉样本、海外历史时区案例和节令秒级边界回归测试。

任何后续功能仍不得设置付费墙。
