import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import {
  DataCard,
  GlassTitle,
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
  return (
    <View style={styles.content}>
      <View style={styles.titleRow}>
        <GlassTitle title="设置" />
      </View>

      <DataCard style={styles.card} contentStyle={styles.cardContent}>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>默认排盘方式</Text>
          <Segmented
            label="默认排盘方式"
            value={settings.defaultCalendarType}
            options={[
              { value: "solar", label: "公历" },
              { value: "lunar", label: "农历" },
              { value: "pillars", label: "四柱" },
            ]}
            onChange={(defaultCalendarType) => onChange({ ...settings, defaultCalendarType })}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.block}>
          <Text style={styles.blockTitle}>默认性别</Text>
          <Segmented
            label="默认性别"
            value={settings.defaultGender}
            options={[{ value: "male", label: "男" }, { value: "female", label: "女" }]}
            onChange={(defaultGender) => onChange({ ...settings, defaultGender })}
          />
        </View>
      </DataCard>

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
      <Text style={styles.version}>元序 · 0.6.4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 14, paddingBottom: 132, gap: 8 },
  titleRow: { paddingTop: 10, alignItems: "center" },
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
  version: { textAlign: "center", color: palette.muted, fontSize: 10, marginTop: 2 },
});
