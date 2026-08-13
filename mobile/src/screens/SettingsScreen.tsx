import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import {
  DataCard,
  GlassSurface,
  isNativeLiquidGlassAvailable,
  ScreenHeader,
  Segmented,
} from "../components/ui";
import type { AppSettings } from "../model";
import { palette, radii } from "../theme";

export function SettingsScreen({
  settings,
  onChange,
}: {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}) {
  const nativeGlassSupported = isNativeLiquidGlassAvailable();
  const glassEnabled = nativeGlassSupported && !settings.reduceGlass;
  const glassStatus =
    Platform.OS !== "ios"
      ? "当前预览平台不支持，iOS 26/27 独立构建真机启用"
      : glassEnabled
        ? "已启用 iOS 原生 UIGlassEffect"
        : nativeGlassSupported
          ? "已按设置关闭，当前使用纯色降级"
          : "Expo Go 或当前构建未提供原生 API；需独立构建验收";

  return (
    <View style={styles.content}>
      <ScreenHeader title="设置" />

      <GlassSurface interactive={false} style={styles.glassStatusCard} contentStyle={styles.glassStatusContent}>
        <View style={[styles.statusIcon, glassEnabled && styles.statusIconActive]}>
          <Ionicons name="sparkles" size={17} color={glassEnabled ? palette.accent : palette.muted} />
        </View>
        <View style={styles.settingCopy}>
          <Text style={styles.blockTitle}>原生液态玻璃</Text>
          <Text style={styles.settingHint}>{glassStatus}</Text>
        </View>
        <View style={[styles.statusDot, glassEnabled && styles.statusDotActive]} />
      </GlassSurface>

      <DataCard style={styles.card} contentStyle={styles.cardContent}>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>子时换日</Text>
          <Segmented
            label="子时换日规则"
            value={settings.dayBoundaryRule}
            options={[{ value: "lateZiNextDay", label: "23:00 换日" }, { value: "midnight", label: "00:00 换日" }]}
            onChange={(dayBoundaryRule) => onChange({ ...settings, dayBoundaryRule })}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.blockTitle}>降低透明度</Text>
            <Text style={styles.settingHint}>开启后停用原生玻璃，使用高可读纯色界面</Text>
          </View>
          <Switch
            accessibilityLabel="降低透明度"
            onValueChange={(reduceGlass) => onChange({ ...settings, reduceGlass })}
            thumbColor={palette.white}
            trackColor={{ false: palette.lineStrong, true: palette.accent }}
            value={settings.reduceGlass}
          />
        </View>
      </DataCard>

      <DataCard style={styles.card} contentStyle={styles.infoRow}>
        <Ionicons name="shield-checkmark-outline" size={19} color={palette.success} />
        <View style={styles.settingCopy}>
          <Text style={styles.blockTitle}>本地隐私</Text>
          <Text style={styles.settingHint}>命盘保存在设备本地；无登录、会员或付费功能。</Text>
        </View>
      </DataCard>

      <DataCard style={styles.auditCard} contentStyle={styles.infoRow}>
        <Ionicons name="checkmark-circle-outline" size={19} color={palette.accent} />
        <View style={styles.settingCopy}>
          <Text style={styles.blockTitle}>神煞规则审计</Text>
          <Text style={styles.settingHint}>已启用经测试的版本化规则；同柱多项全部保留，可在命盘中展开查看。</Text>
        </View>
      </DataCard>
      <Text style={styles.version}>元序 · 0.5.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 14, paddingBottom: 104, gap: 8 },
  glassStatusCard: { height: 66, borderRadius: radii.large },
  glassStatusContent: { flex: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 9 },
  statusIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: palette.surfaceStrong },
  statusIconActive: { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.lineStrong },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.neutral },
  statusDotActive: { backgroundColor: palette.success },
  card: { borderRadius: radii.large },
  cardContent: { padding: 12, gap: 12 },
  block: { gap: 7 },
  blockTitle: { color: palette.text, fontSize: 13, fontWeight: "800" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingCopy: { flex: 1, gap: 2 },
  settingHint: { color: palette.muted, fontSize: 9, lineHeight: 13 },
  infoRow: { minHeight: 64, padding: 12, flexDirection: "row", alignItems: "center", gap: 9 },
  auditCard: { borderRadius: radii.large },
  version: { textAlign: "center", color: palette.muted, fontSize: 9, marginTop: 2 },
});
