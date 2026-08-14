# 元序 iOS App

这是 `free-bazi` 的 Expo / React Native 移动端工程。当前阶段用于真机和浏览器交互预览，复用仓库内 `src/lib/bazi` 的真实历法、四柱、大运和流运算法，不包含静态假数据。

## 已实现

- 公历、农历、性别、出生日期时间和中国城市输入；
- 多命盘本地档案库：完成排盘后自动保存，可从档案直接进入并修改同一记录；
- 原盘、细盘、流通三个主页面；
- 细盘简洁 / 详细模式，顶部按需加入流月、流日、流时；4–9 列自适应等分，无页面横向滚动；
- 十神、藏干十神、纳音、空亡、十二长生；
- 关系线直接标注原局或所选时运中具体柱位的天干生克五合、地支合冲刑害破、三合和三会；
- 大运、流年、流月、流日、流时均保留独立时间轴，干支竖排；流年标注换运、岁运并临、伏吟和天克地冲；
- 神煞采用版本化的《三命通会》常用神煞表 v3，只展示可复核的规则命中；
- iOS 26/27 独立构建使用系统 Liquid Glass；Expo Go、Web 和不支持的系统自动使用轻量模糊降级；
- 无登录、无会员、无付费墙。

## 神煞准确性边界

当前开放 v3 固定目录中的 40 项规则；同柱多项完整保留，命中较多时可折叠或展开。固定口径、古籍文本来源与测试约束见 [`docs/shen-sha-standard-v3.md`](../docs/shen-sha-standard-v3.md)。界面只展示规则命中，不用神煞生成确定性吉凶。

新增神煞必须先补规则版本和整张映射表测试；存在明显流派分歧的条目不会混入现有版本。

## Liquid Glass 边界

所有操作型玻璃控件均直接由本地 UIKit 模块提供：主操作、修改、神煞展开 / 收起与开关使用 `UIButton.Configuration.glass()`；多选项使用 `UISegmentedControl`；底部导航使用未自定义外观的 `UITabBar`。应用不会再对这些控件叠加自绘蓝色、选中透镜、缩放或拖动动画，材质、形变和动态颜色均由 iOS 决定。

Expo Go 是预编译宿主，不能加载本项目的本地 UIKit 模块。最终 IPA / development build 必须使用 Xcode 26 或更高版本编译、保持 `UIDesignRequiresCompatibility=false`，并在 iOS 26/27 真机确认设置页显示“已启用 iOS 原生玻璃控件”。不支持时保留系统的标准按钮或轻量降级，不伪装为原生玻璃。

## 本地预览

从仓库根目录执行：

```bash
pnpm install
pnpm mobile
```

随后可在电脑浏览器打开终端显示的 Web 地址，或在同一局域网的 iPhone 上使用 Expo Go 扫描二维码。Expo Go 可审查结构、排版、动效和交互，但不能作为原生 Liquid Glass 的最终验收环境。

常用检查：

```bash
pnpm mobile:typecheck
pnpm --dir mobile export:web
```

## iOS 构建与签名边界

仓库提供 `.github/workflows/build-ios-unsigned.yml`，在 macOS 26 / Xcode 26.6 中从源码编译本地 UIKit 控件模块，并生成仅含 arm64 真机程序的未签名 IPA。构建会检查 `UIDesignRequiresCompatibility=false`、`UIButton.Configuration.glass()`、`UISegmentedControl`、`UITabBar`、应用显示名和 arm64 架构。

未签名 IPA 不能直接安装，需在本地使用与设备匹配的证书和描述文件重新签名。构建过程不需要上传第三方证书或密码；`.p12`、`.mobileprovision`、`credentials.json` 与 `.eas/` 均被 `.gitignore` 排除。最终仍须在 iOS 26/27 真机确认设置页显示“已启用 iOS 原生玻璃控件”。
