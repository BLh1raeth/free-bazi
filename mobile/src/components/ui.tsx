import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
  type GlassStyle,
} from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { createContext, useContext, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  NativeLiquidButton,
  NativeLiquidSelector,
  NativeLiquidSegmented,
  NativeLiquidTabBar,
} from "../../modules/native-liquid-controls";
import { palette, radii, shadows } from "../theme";

type GlassSurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  interactive?: boolean;
  accessibilityLabel?: string;
  glassStyle?: GlassStyle;
  tintColor?: string;
  fallbackColor?: string;
  native?: boolean;
};

const GlassPreferencesContext = createContext({ reduceGlass: false });
const LIQUID_TINT = "rgba(255, 255, 255, 0.34)";
const LIQUID_FALLBACK = "rgba(249, 251, 255, 0.94)";
const CONTROL_FALLBACK = "rgba(239, 243, 249, 0.96)";

export function isNativeLiquidGlassAvailable(): boolean {
  return (
    Platform.OS === "ios" &&
    isGlassEffectAPIAvailable() &&
    isLiquidGlassAvailable()
  );
}

export function isNativeUIKitLiquidControlsAvailable(): boolean {
  return (
    Platform.OS === "ios" &&
    Number(Platform.Version) >= 26 &&
    NativeLiquidButton !== null &&
    NativeLiquidSegmented !== null &&
    NativeLiquidTabBar !== null
  );
}

export function GlassPreferencesProvider({
  children,
  reduceGlass,
}: {
  children: ReactNode;
  reduceGlass: boolean;
}) {
  return (
    <GlassPreferencesContext.Provider value={{ reduceGlass }}>
      {children}
    </GlassPreferencesContext.Provider>
  );
}

function useNativeGlass(): boolean {
  const { reduceGlass } = useContext(GlassPreferencesContext);
  return !reduceGlass && isNativeLiquidGlassAvailable();
}

// This path is intentionally independent from expo-glass-effect's feature
// detector. A standalone IPA autolinks the UIKit module; UIKit itself chooses
// .glass() on iOS 26+ (and its built-in fallback on older iOS versions).
function useNativeUIKitControls(): boolean {
  const { reduceGlass } = useContext(GlassPreferencesContext);
  return !reduceGlass && isNativeUIKitLiquidControlsAvailable();
}

/**
 * Non-actionable display material only. iOS 26 action controls are deliberately
 * rendered by UIKit below, rather than by a React Native GlassView wrapper.
 */
export function GlassSurface({
  children,
  style,
  contentStyle,
  interactive = false,
  accessibilityLabel,
  glassStyle = "clear",
  tintColor = LIQUID_TINT,
  fallbackColor,
  native = true,
}: GlassSurfaceProps) {
  const nativeGlass = useNativeGlass() && native;
  const { reduceGlass } = useContext(GlassPreferencesContext);

  if (nativeGlass) {
    return (
      <GlassView
        accessibilityLabel={accessibilityLabel}
        colorScheme="light"
        glassEffectStyle={{ style: glassStyle }}
        isInteractive={interactive}
        tintColor={tintColor}
        style={[styles.glassFrame, style]}
      >
        <View style={[styles.nativeGlassContent, contentStyle]}>{children}</View>
      </GlassView>
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.glassFrame, style]}>
      {reduceGlass ? (
        <View style={[StyleSheet.absoluteFill, styles.opaqueSurface]} />
      ) : (
        <BlurView
          tint="systemUltraThinMaterialLight"
          intensity={Platform.OS === "web" ? 22 : 46}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        style={[
          styles.fallbackContent,
          fallbackColor ? { backgroundColor: fallbackColor } : null,
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

type LiquidPressableProps = {
  children: ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "switch" | "tab";
  accessibilityState?: { selected?: boolean; checked?: boolean; disabled?: boolean };
  disabled?: boolean;
  haptic?: "selection" | "light";
};

/**
 * This remains solely as a safe fallback for Expo Go, web, and iOS before 26.
 * It intentionally has no artificial drag, spring, lens, or scale animation.
 */
export function LiquidPressable({
  children,
  onPress,
  style,
  contentStyle,
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
  disabled = false,
  haptic = "selection",
}: LiquidPressableProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      onPress={() => {
        if (haptic === "light") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          void Haptics.selectionAsync();
        }
        onPress();
      }}
      style={({ pressed }) => [style, disabled && styles.disabled, pressed && styles.fallbackPressed]}
    >
      <View style={contentStyle}>{children}</View>
    </Pressable>
  );
}

export function ContentTransition({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  // Navigation motion is owned by UIKit for its controls. Keeping content in a
  // stable React Native view prevents it from invalidating system glass layers.
  return <View style={style}>{children}</View>;
}

export function DataCard({
  children,
  style,
  contentStyle,
  accessibilityLabel,
}: Omit<GlassSurfaceProps, "interactive" | "glassStyle" | "tintColor" | "fallbackColor">) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.dataCard, style]}>
      <View style={[styles.dataCardContent, contentStyle]}>{children}</View>
    </View>
  );
}

export function ScreenHeader({
  title,
  action,
  leading,
}: {
  title: string;
  action?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={[styles.headerSpacer, styles.headerLeading]}>{leading}</View>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer}>{action}</View>
    </View>
  );
}

export function SystemGlassButton({
  label,
  onPress,
  style,
  systemImage,
  disabled = false,
  selected = false,
  accessibilityLabel,
  fontSize,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  systemImage?: string;
  disabled?: boolean;
  selected?: boolean;
  accessibilityLabel?: string;
  fontSize?: number;
}) {
  const useNativeButton = useNativeUIKitControls() && NativeLiquidButton !== null;
  const performPress = () => {
    void Haptics.selectionAsync();
    onPress();
  };

  if (useNativeButton && NativeLiquidButton) {
    return (
      <NativeLiquidButton
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        fontSize={fontSize}
        // UIKit's standard .glass configuration is intentionally un-tinted.
        systemImage={systemImage}
        selected={selected}
        style={[styles.nativeButton, style]}
        title={label}
        onPress={performPress}
      />
    );
  }

  return (
    <LiquidPressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={performPress}
      style={style}
    >
      <GlassSurface
        interactive
        native={false}
        fallbackColor={selected ? "rgba(230, 236, 247, 0.96)" : CONTROL_FALLBACK}
        style={styles.fallbackSystemButton}
      >
        <Text style={[styles.systemButtonText, selected && styles.systemButtonTextSelected, fontSize ? { fontSize } : null]}>{label}</Text>
      </GlassSurface>
    </LiquidPressable>
  );
}

const iconToSymbol: Partial<Record<keyof typeof Ionicons.glyphMap, string>> = {
  "chevron-back": "chevron.left",
  "chevron-forward": "chevron.right",
  "location-outline": "mappin.and.ellipse",
  "ellipsis-horizontal": "ellipsis",
  "create-outline": "square.and.pencil",
  "folder-open-outline": "folder",
  "settings-outline": "gearshape",
};

export function IconGlassButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const systemImage = iconToSymbol[icon];
  const useNativeButton = useNativeUIKitControls() && NativeLiquidButton !== null;

  if (useNativeButton) {
    return (
      <SystemGlassButton
        accessibilityLabel={label}
        label=""
        onPress={onPress}
        style={styles.iconButton}
        systemImage={systemImage}
      />
    );
  }

  return (
    <LiquidPressable accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>
      <GlassSurface interactive native={false} style={styles.iconButton}>
        <Ionicons name={icon} size={18} color={palette.primary} />
      </GlassSurface>
    </LiquidPressable>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const useNativeSegmented = useNativeUIKitControls() && NativeLiquidSegmented !== null;

  if (useNativeSegmented && NativeLiquidSegmented) {
    return (
      <NativeLiquidSegmented
        accessibilityLabel={label}
        options={options.map((option) => option.label)}
        selectedIndex={selectedIndex}
        style={styles.nativeSegmented}
        onSelectionChange={(event) => {
          const index = options.findIndex((option) => option.label === event.nativeEvent.value);
          const next = options[index];
          if (next) onChange(next.value);
        }}
      />
    );
  }

  return (
    <View accessibilityLabel={label} style={styles.segmentedFallback}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActiveFallback]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 Single-choice row that reuses the exact UIKit UITabBar used by the bottom
 bar, so gender/calendar selectors get the identical Liquid Glass material,
 connected layout, and selected tint. Falls back to chips outside iOS 26.
 */
export function LiquidSelector<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const useNativeSelector = Platform.OS === "ios" && Number(Platform.Version) >= 26 && NativeLiquidSelector !== null;

  if (useNativeSelector && NativeLiquidSelector) {
    return (
      <NativeLiquidSelector
        accessibilityLabel={label}
        options={options.map((option) => option.label)}
        selectedIndex={selectedIndex}
        style={styles.nativeSelector}
        onSelectionChange={(event) => {
          const index = options.findIndex((option) => option.label === event.nativeEvent.value);
          const next = options[index];
          if (next) onChange(next.value);
        }}
      />
    );
  }

  return (
    <View accessibilityLabel={label} style={styles.segmentedFallback}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActiveFallback]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return <SystemGlassButton label={label} onPress={onPress} selected={active} style={styles.chip} />;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return <SystemGlassButton disabled={disabled} label={label} onPress={onPress} style={styles.primaryButton} />;
}

export type AppTab = "input" | "archive" | "settings";

const TAB_ITEMS: Array<{ value: AppTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: "input", label: "排盘", icon: "create-outline" },
  { value: "archive", label: "档案库", icon: "folder-open-outline" },
  { value: "settings", label: "设置", icon: "settings-outline" },
];

export function BottomNav({
  value,
  onChange,
}: {
  value: AppTab;
  onChange: (value: AppTab) => void;
}) {
  const useNativeTabBar = useNativeUIKitControls() && NativeLiquidTabBar !== null;

  if (useNativeTabBar && NativeLiquidTabBar) {
    return (
      <NativeLiquidTabBar
        selectedTab={value}
        style={styles.nativeTabBar}
        onSelectionChange={(event) => {
          const next = event.nativeEvent.value as AppTab;
          if (TAB_ITEMS.some((item) => item.value === next)) onChange(next);
        }}
      />
    );
  }

  return (
    <GlassSurface interactive native={false} style={styles.fallbackBottomBar}>
      <View style={styles.bottomBarInner}>
        {TAB_ITEMS.map((item) => {
          const active = item.value === value;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={item.value}
              onPress={() => onChange(item.value)}
              style={[styles.bottomItem, active && styles.bottomItemActive]}
            >
              <Ionicons name={item.icon} size={20} color={active ? palette.accent : palette.muted} />
              <Text style={[styles.bottomItemText, active && styles.bottomItemTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </GlassSurface>
  );
}

export function SectionHeading({
  title,
  trailing,
}: {
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  glassFrame: {
    overflow: "hidden",
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(64, 79, 106, 0.14)",
    ...shadows.glass,
  },
  nativeGlassContent: { flex: 1, minWidth: 0, minHeight: 0, alignItems: "center", justifyContent: "center" },
  fallbackContent: {
    ...StyleSheet.absoluteFillObject,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: LIQUID_FALLBACK,
    alignItems: "center",
    justifyContent: "center",
  },
  opaqueSurface: { backgroundColor: palette.surfaceStrong },
  fallbackPressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
  dataCard: {
    overflow: "hidden",
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineStrong,
    backgroundColor: palette.surface,
    ...shadows.card,
  },
  dataCardContent: { minWidth: 0 },
  header: { height: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerSpacer: { width: 72, alignItems: "flex-end" },
  headerLeading: { alignItems: "flex-start" },
  headerTitle: { fontSize: 20, lineHeight: 24, fontWeight: "800", color: palette.primary, letterSpacing: 1 },
  nativeButton: { height: 32, minHeight: 32, justifyContent: "center" },
  nativeSelector: { height: 48, minHeight: 48, flex: 1, minWidth: 0 },
  fallbackSystemButton: { flex: 1, minHeight: 36, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  systemButtonText: { color: palette.primary, fontSize: 13, fontWeight: "700", includeFontPadding: false },
  systemButtonTextSelected: { color: palette.accent, fontWeight: "800" },
  iconButton: { width: 38, height: 38, borderRadius: 19 },
  nativeSegmented: { height: 34, minHeight: 34 },
  segmentedFallback: {
    height: 34,
    minHeight: 34,
    flexDirection: "row",
    padding: 2,
    borderRadius: radii.pill,
    backgroundColor: CONTROL_FALLBACK,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(64, 79, 106, 0.14)",
  },
  segment: { flex: 1, minHeight: 28, alignItems: "center", justifyContent: "center", borderRadius: radii.pill },
  segmentActiveFallback: { backgroundColor: "rgba(226, 233, 245, 0.86)" },
  segmentText: { textAlign: "center", color: palette.primary, fontSize: 13, fontWeight: "600", includeFontPadding: false },
  segmentTextActive: { color: palette.accent, fontWeight: "800" },
  chip: { minWidth: 52, height: 30, minHeight: 30, borderRadius: 15 },
  primaryButton: { width: "100%", height: 48, minHeight: 48, borderRadius: radii.pill },
  // The native view does not stretch from an intrinsic size like a plain RN
  // view, so width must be explicit to match the fallback bar exactly.
  nativeTabBar: { width: "100%", height: 88 },
  fallbackBottomBar: { height: 88, borderRadius: 36 },
  bottomBarInner: { flex: 1, padding: 4, flexDirection: "row" },
  bottomItem: { flex: 1, minWidth: 0, borderRadius: 22, alignItems: "center", justifyContent: "center", gap: 1 },
  bottomItemActive: { backgroundColor: "rgba(226, 233, 245, 0.86)" },
  bottomItemText: { textAlign: "center", fontSize: 11, color: palette.muted, fontWeight: "600" },
  bottomItemTextActive: { color: palette.primary, fontWeight: "800" },
  sectionHeading: { minHeight: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: palette.primary },
});
