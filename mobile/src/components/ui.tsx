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
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  PanResponder,
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
const LIQUID_TINT = "rgba(205, 225, 255, 0.58)";
const LIQUID_ACTIVE_TINT = "rgba(186, 216, 252, 0.68)";
const LIQUID_FALLBACK = "rgba(222, 236, 255, 0.90)";

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
  tintColor = LIQUID_TINT,
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
 * Shared tactile motion for every glass control. The small compression makes
 * the native iOS glass surface feel like a responsive lens instead of a flat
 * translucent rectangle, while the spring restores it with a visible rebound.
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
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const didDrag = useRef(false);

  const animatePress = (pressed: boolean) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: pressed ? 0.94 : 1,
        speed: pressed ? 30 : 19,
        bounciness: pressed ? 3 : 9,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(lift, {
        toValue: pressed ? 1 : 0,
        speed: pressed ? 30 : 19,
        bounciness: pressed ? 3 : 9,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  };

  const liquidDrag = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      !disabled && Math.abs(gesture.dx) > 9 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
    onPanResponderGrant: () => {
      didDrag.current = true;
      void Haptics.selectionAsync();
    },
    onPanResponderMove: (_, gesture) => {
      dragX.setValue(Math.max(-14, Math.min(14, gesture.dx)));
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: () => {
      Animated.spring(dragX, {
        toValue: 0,
        speed: 20,
        bounciness: 10,
        useNativeDriver: Platform.OS !== "web",
      }).start();
      // A horizontal drag captures the responder, so the nested Pressable
      // does not receive its release. Clear this flag before the next tap.
      didDrag.current = false;
    },
    onPanResponderTerminate: () => {
      Animated.spring(dragX, {
        toValue: 0,
        speed: 20,
        bounciness: 10,
        useNativeDriver: Platform.OS !== "web",
      }).start();
      didDrag.current = false;
    },
  });

  return (
    <View {...liquidDrag.panHandlers} style={[style, disabled && styles.disabled]}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ ...accessibilityState, disabled }}
        disabled={disabled}
        onPress={() => {
          if (didDrag.current) {
            didDrag.current = false;
            return;
          }
          if (haptic === "light") {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else {
            void Haptics.selectionAsync();
          }
          onPress();
        }}
        onPressIn={() => animatePress(true)}
        onPressOut={() => animatePress(false)}
      >
        <Animated.View
          style={[
            contentStyle,
            {
              transform: [
                { scale },
                {
                  translateX: dragX,
                },
                {
                  translateY: lift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
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
    <LiquidPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      contentStyle={styles.iconButtonPressable}
    >
      <GlassSurface interactive style={styles.iconButton}>
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
  const nativeGlass = useNativeGlass();
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const lensPosition = useRef(new Animated.Value(selectedIndex)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);
  const lensWidth = segmentWidth > 0 ? Math.max(0, (segmentWidth - 4) / options.length) : 0;

  const selectIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(options.length - 1, index));
    const nextOption = options[nextIndex];
    if (nextOption && nextIndex !== selectedIndex) {
      void Haptics.selectionAsync();
      onChange(nextOption.value);
    }
  };

  useEffect(() => {
    Animated.spring(lensPosition, {
      toValue: selectedIndex,
      speed: 16,
      bounciness: 8,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [lensPosition, selectedIndex]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, gesture) => {
      const limit = Math.max(20, lensWidth * 0.42);
      dragOffset.setValue(Math.max(-limit, Math.min(limit, gesture.dx)));
    },
    onPanResponderRelease: (_, gesture) => {
      const direction = gesture.dx <= -24 ? 1 : gesture.dx >= 24 ? -1 : 0;
      Animated.spring(dragOffset, {
        toValue: 0,
        speed: 18,
        bounciness: 9,
        useNativeDriver: Platform.OS !== "web",
      }).start();
      if (direction !== 0) selectIndex(selectedIndex + direction);
    },
    onPanResponderTerminate: () => {
      Animated.spring(dragOffset, {
        toValue: 0,
        speed: 18,
        bounciness: 9,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    },
  });

  const lens = lensWidth > 0 ? (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.segmentLensLayer,
        {
          width: lensWidth,
          transform: [{ translateX: Animated.add(Animated.multiply(lensPosition, lensWidth), dragOffset) }],
        },
      ]}
    >
      {nativeGlass ? (
        <GlassView
          colorScheme="light"
          glassEffectStyle={{ style: "regular", animate: true, animationDuration: 0.4 }}
          isInteractive
          tintColor={LIQUID_ACTIVE_TINT}
          style={styles.segmentActiveGlass}
        />
      ) : (
        <View style={styles.segmentActiveFallback} />
      )}
    </Animated.View>
  ) : null;

  const items = (
    <View style={styles.segmentedInner}>
      {lens}
      {options.map((option) => {
        const active = option.value === value;
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
            style={({ pressed }) => [styles.segment, pressed && styles.segmentPressed]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (nativeGlass) {
    return (
      <View {...panResponder.panHandlers} onLayout={(event) => setSegmentWidth(event.nativeEvent.layout.width)}>
        <GlassContainer spacing={7} style={styles.segmented}>
          <GlassView
            colorScheme="light"
            glassEffectStyle="clear"
            tintColor={LIQUID_TINT}
            style={styles.segmentedOuterGlass}
          />
          {items}
        </GlassContainer>
      </View>
    );
  }

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={(event) => setSegmentWidth(event.nativeEvent.layout.width)}
      style={[styles.segmented, styles.segmentedFallback]}
    >
      {items}
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
  return (
    <LiquidPressable
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      onPress={onPress}
    >
      <GlassSurface
        interactive
        style={[styles.chip, active && styles.chipActive]}
        tintColor={active ? LIQUID_ACTIVE_TINT : LIQUID_TINT}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </GlassSurface>
    </LiquidPressable>
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
    <LiquidPressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      haptic="light"
      onPress={onPress}
      style={styles.primaryPressable}
    >
      <GlassSurface
        interactive
        glassStyle="regular"
        tintColor={LIQUID_ACTIVE_TINT}
        fallbackColor={LIQUID_FALLBACK}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>{label}</Text>
      </GlassSurface>
    </LiquidPressable>
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

function BottomNavItem({
  item,
  active,
  onPress,
}: {
  item: (typeof TAB_ITEMS)[number];
  active: boolean;
  onPress: () => void;
}) {
  const emphasis = useRef(new Animated.Value(active ? 1.1 : 0.94)).current;

  useEffect(() => {
    Animated.spring(emphasis, {
      toValue: active ? 1.1 : 0.94,
      speed: 15,
      bounciness: 8,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [active, emphasis]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.bottomItem}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.bottomItemContent,
            {
              transform: [
                { scale: pressed ? 0.92 : emphasis },
                { translateY: active ? -1 : 0 },
              ],
            },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={active ? palette.accent : palette.muted}
          />
          <Text style={[styles.bottomItemText, active && styles.bottomItemTextActive]}>
            {item.label}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

export function BottomNav({
  value,
  onChange,
}: {
  value: AppTab;
  onChange: (value: AppTab) => void;
}) {
  const nativeGlass = useNativeGlass();
  const selectedIndex = Math.max(0, TAB_ITEMS.findIndex((item) => item.value === value));
  const lensPosition = useRef(new Animated.Value(selectedIndex)).current;
  const dragOffset = useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = useState(0);
  const lensWidth = barWidth > 0 ? Math.max(0, (barWidth - 10) / TAB_ITEMS.length) : 0;

  const selectIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(TAB_ITEMS.length - 1, index));
    const nextItem = TAB_ITEMS[nextIndex];
    if (nextItem && nextIndex !== selectedIndex) {
      void Haptics.selectionAsync();
      onChange(nextItem.value);
    }
  };

  useEffect(() => {
    Animated.spring(lensPosition, {
      toValue: selectedIndex,
      speed: 14,
      bounciness: 9,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [lensPosition, selectedIndex]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.15,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, gesture) => {
      const limit = Math.max(26, lensWidth * 0.46);
      dragOffset.setValue(Math.max(-limit, Math.min(limit, gesture.dx)));
    },
    onPanResponderRelease: (_, gesture) => {
      const direction = gesture.dx <= -26 ? 1 : gesture.dx >= 26 ? -1 : 0;
      Animated.spring(dragOffset, {
        toValue: 0,
        speed: 18,
        bounciness: 8,
        useNativeDriver: Platform.OS !== "web",
      }).start();
      if (direction !== 0) {
        selectIndex(selectedIndex + direction);
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(dragOffset, {
        toValue: 0,
        speed: 18,
        bounciness: 8,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    },
  });

  const lens = lensWidth > 0 ? (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bottomLensLayer,
        {
          width: lensWidth,
          transform: [
            { translateX: Animated.add(Animated.multiply(lensPosition, lensWidth), dragOffset) },
          ],
        },
      ]}
    >
      {nativeGlass ? (
        <GlassView
          colorScheme="light"
          glassEffectStyle={{ style: "regular", animate: true, animationDuration: 0.42 }}
          isInteractive
          tintColor={LIQUID_ACTIVE_TINT}
          style={styles.bottomActiveGlass}
        />
      ) : (
        <View style={styles.bottomActiveFallback} />
      )}
    </Animated.View>
  ) : null;

  const navItems = TAB_ITEMS.map((item, index) => (
    <BottomNavItem
      active={index === selectedIndex}
      item={item}
      key={item.value}
      onPress={() => selectIndex(index)}
    />
  ));

  const content = (
    <View
      {...panResponder.panHandlers}
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      style={styles.bottomNavGesture}
    >
      {nativeGlass ? (
        <GlassContainer spacing={9} style={styles.bottomBar}>
          <GlassView
            colorScheme="light"
            glassEffectStyle="clear"
            tintColor={LIQUID_TINT}
            style={styles.bottomOuterGlass}
          />
          {lens}
          <View style={styles.bottomBarInner}>{navItems}</View>
        </GlassContainer>
      ) : (
        <View style={[styles.bottomBar, styles.bottomBarFallback]}>
          {lens}
          <View style={styles.bottomBarInner}>{navItems}</View>
        </View>
      )}
    </View>
  );

  return content;
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
    backgroundColor: LIQUID_FALLBACK,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackInteractiveHighlight: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.96)",
    backgroundColor: "rgba(204, 226, 255, 0.70)",
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
  iconButtonPressable: { borderRadius: 13 },
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
    position: "relative",
  },
  segment: {
    flex: 1,
    minHeight: 30,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentPressed: { opacity: 0.72 },
  segmentLensLayer: {
    position: "absolute",
    left: 2,
    top: 2,
    bottom: 2,
    zIndex: 0,
  },
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
    height: 72,
    borderRadius: 32,
    overflow: "hidden",
    ...shadows.glass,
  },
  bottomNavGesture: { height: 72 },
  bottomBarFallback: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.88)",
    backgroundColor: "rgba(238, 245, 255, 0.82)",
  },
  bottomOuterGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  bottomLensLayer: {
    position: "absolute",
    left: 5,
    top: 5,
    bottom: 5,
    zIndex: 0,
  },
  bottomBarInner: { flex: 1, padding: 5, flexDirection: "row", zIndex: 1 },
  bottomItem: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomItemContent: {
    width: 64,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  bottomActiveGlass: {
    flex: 1,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glass,
  },
  bottomActiveFallback: {
    flex: 1,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
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
