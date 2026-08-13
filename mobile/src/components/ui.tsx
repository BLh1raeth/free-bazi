import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
  type GlassStyle,
} from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
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
};

const GlassPreferencesContext = createContext({ reduceGlass: false });

export function isNativeLiquidGlassAvailable(): boolean {
  return (
    Platform.OS === "ios" &&
    isGlassEffectAPIAvailable() &&
    isLiquidGlassAvailable()
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

export function GlassSurface({
  children,
  style,
  contentStyle,
  interactive = false,
  accessibilityLabel,
  glassStyle = "clear",
  tintColor = "rgba(232, 240, 255, 0.36)",
  fallbackColor,
}: GlassSurfaceProps) {
  const nativeGlass = useNativeGlass();
  const { reduceGlass } = useContext(GlassPreferencesContext);

  if (nativeGlass) {
    return (
      <GlassView
        accessibilityLabel={accessibilityLabel}
        colorScheme="light"
        glassEffectStyle={{
          style: glassStyle,
          animate: true,
          animationDuration: 0.26,
        }}
        isInteractive={interactive}
        tintColor={tintColor}
        style={[styles.glassFrame, style, contentStyle]}
      >
        {children}
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
          interactive && styles.fallbackInteractiveHighlight,
          fallbackColor ? { backgroundColor: fallbackColor } : null,
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export function ContentTransition({
  children,
  transitionKey,
  style,
}: {
  children: ReactNode;
  transitionKey: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [progress, transitionKey]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
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

export function IconGlassButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <GlassSurface interactive style={styles.iconButton}>
        <Ionicons name={icon} size={18} color={palette.primary} />
      </GlassSurface>
    </Pressable>
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
  const nativeGlass = useNativeGlass();
  const items = (
    <View style={styles.segmentedInner}>
      {options.map((option) => {
        const active = option.value === value;
        const content = (
          <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
            {option.label}
          </Text>
        );
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}：${option.label}`}
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(option.value);
            }}
            style={({ pressed }) => [styles.segment, pressed && styles.pressed]}
          >
            {active ? (
              nativeGlass ? (
                <GlassView
                  colorScheme="light"
                  glassEffectStyle={{
                    style: "regular",
                    animate: true,
                    animationDuration: 0.24,
                  }}
                  isInteractive
                  tintColor="rgba(230, 239, 255, 0.28)"
                  style={styles.segmentActiveGlass}
                >
                  {content}
                </GlassView>
              ) : (
                <View style={styles.segmentActiveFallback}>{content}</View>
              )
            ) : (
              content
            )}
          </Pressable>
        );
      })}
    </View>
  );

  if (nativeGlass) {
    return (
      <GlassContainer spacing={5} style={styles.segmented}>
        <GlassView
          colorScheme="light"
          glassEffectStyle="clear"
          tintColor="rgba(239, 245, 255, 0.22)"
          style={styles.segmentedOuterGlass}
        />
        {items}
      </GlassContainer>
    );
  }

  return <View style={[styles.segmented, styles.segmentedFallback]}>{items}</View>;
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
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <GlassSurface
        interactive
        style={[styles.chip, active && styles.chipActive]}
        tintColor={active ? "rgba(208, 225, 255, 0.42)" : "rgba(245, 248, 255, 0.25)"}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </GlassSurface>
    </Pressable>
  );
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.primaryPressable, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <GlassSurface
        interactive
        glassStyle="regular"
        tintColor="rgba(222, 235, 255, 0.34)"
        fallbackColor="rgba(255,255,255,0.82)"
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>{label}</Text>
      </GlassSurface>
    </Pressable>
  );
}

export type AppTab = "input" | "archive" | "settings";

const TAB_ITEMS: Array<{
  value: AppTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
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
  const nativeGlass = useNativeGlass();
  const navItems = TAB_ITEMS.map((item) => {
    const active = item.value === value;
    const content = (
      <View style={styles.bottomItemContent}>
        <Ionicons
          name={item.icon}
          size={20}
          color={active ? palette.accent : palette.muted}
        />
        <Text style={[styles.bottomItemText, active && styles.bottomItemTextActive]}>
          {item.label}
        </Text>
      </View>
    );
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        key={item.value}
        onPress={() => {
          void Haptics.selectionAsync();
          onChange(item.value);
        }}
        style={({ pressed }) => [styles.bottomItem, pressed && styles.pressed]}
      >
        {active ? (
          nativeGlass ? (
            <GlassView
              colorScheme="light"
              glassEffectStyle={{
                style: "regular",
                animate: true,
                animationDuration: 0.24,
              }}
              isInteractive
              tintColor="rgba(218, 231, 255, 0.32)"
              style={styles.bottomActiveGlass}
            >
              {content}
            </GlassView>
          ) : (
            <View style={styles.bottomActiveFallback}>{content}</View>
          )
        ) : (
          content
        )}
      </Pressable>
    );
  });

  return nativeGlass ? (
    <GlassContainer spacing={8} style={styles.bottomBar}>
      <GlassView
        colorScheme="light"
        glassEffectStyle="clear"
        tintColor="rgba(235, 242, 255, 0.28)"
        style={styles.bottomOuterGlass}
      />
      <View style={styles.bottomBarInner}>{navItems}</View>
    </GlassContainer>
  ) : (
    <GlassSurface style={styles.bottomBar} contentStyle={styles.bottomBarInner}>
      {navItems}
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
    borderColor: "rgba(255,255,255,0.92)",
    ...shadows.glass,
  },
  fallbackContent: {
    ...StyleSheet.absoluteFillObject,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: "rgba(248, 251, 255, 0.64)",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackInteractiveHighlight: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.96)",
    backgroundColor: "rgba(248,251,255,0.48)",
  },
  opaqueSurface: { backgroundColor: palette.surfaceStrong },
  dataCard: {
    overflow: "hidden",
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineStrong,
    backgroundColor: palette.surface,
    ...shadows.card,
  },
  dataCardContent: { minWidth: 0 },
  header: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSpacer: { width: 72, alignItems: "flex-end" },
  headerLeading: { alignItems: "flex-start" },
  headerTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    color: palette.primary,
    letterSpacing: 1,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  segmented: {
    minHeight: 36,
    borderRadius: radii.pill,
    overflow: "visible",
  },
  segmentedFallback: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineStrong,
    backgroundColor: "rgba(244, 248, 255, 0.82)",
  },
  segmentedOuterGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.pill,
  },
  segmentedInner: {
    flex: 1,
    padding: 2,
    flexDirection: "row",
  },
  segment: { flex: 1, minHeight: 30, justifyContent: "center" },
  segmentActiveGlass: {
    flex: 1,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glass,
  },
  segmentActiveFallback: {
    flex: 1,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,1)",
    ...shadows.glass,
  },
  segmentText: {
    textAlign: "center",
    color: palette.primary,
    fontSize: 13,
    fontWeight: "600",
    includeFontPadding: false,
  },
  segmentTextActive: { color: palette.accent, fontWeight: "800" },
  chip: {
    minWidth: 58,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  chipActive: { borderColor: "rgba(91, 142, 224, 0.42)" },
  chipText: { width: "100%", textAlign: "center", fontSize: 12, lineHeight: 16, color: palette.primary, fontWeight: "600", includeFontPadding: false },
  chipTextActive: { color: palette.accent, fontWeight: "800" },
  primaryButton: {
    width: "100%",
    minHeight: 50,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(90, 137, 211, 0.28)",
  },
  primaryPressable: { width: "100%" },
  primaryButtonText: {
    color: palette.accent,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bottomBar: {
    height: 68,
    borderRadius: 28,
    overflow: "hidden",
    ...shadows.glass,
  },
  bottomOuterGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  bottomBarInner: { flex: 1, padding: 4, flexDirection: "row" },
  bottomItem: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomItemContent: {
    width: 58,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  bottomActiveGlass: {
    width: 58,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  bottomActiveFallback: {
    width: 58,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    backgroundColor: "rgba(255,255,255,0.88)",
    ...shadows.glass,
  },
  bottomItemText: {
    textAlign: "center",
    fontSize: 11,
    color: palette.muted,
    fontWeight: "600",
  },
  bottomItemTextActive: { color: palette.primary, fontWeight: "800" },
  sectionHeading: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: palette.primary },
  pressed: { transform: [{ scale: 0.975 }] },
  disabled: { opacity: 0.45 },
});
