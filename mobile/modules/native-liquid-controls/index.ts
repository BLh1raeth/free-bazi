import { requireNativeView, requireOptionalNativeModule } from "expo";
import type { ComponentType } from "react";
import type { ViewProps } from "react-native";

type NativePressEvent = { nativeEvent: Record<string, never> };
type NativeSelectionEvent = { nativeEvent: { value: string } };

export type NativeLiquidButtonProps = ViewProps & {
  title: string;
  systemImage?: string;
  disabled?: boolean;
  selected?: boolean;
  fontSize?: number;
  onPress?: (event: NativePressEvent) => void;
};

export type NativeLiquidSegmentedProps = ViewProps & {
  options: string[];
  selectedIndex: number;
  disabled?: boolean;
  onSelectionChange?: (event: NativeSelectionEvent) => void;
};

export type NativeLiquidTabBarProps = ViewProps & {
  selectedTab: string;
  onSelectionChange?: (event: NativeSelectionEvent) => void;
};

export type NativeLiquidSelectorProps = ViewProps & {
  options: string[];
  selectedIndex: number;
  disabled?: boolean;
  onSelectionChange?: (event: NativeSelectionEvent) => void;
};

// Expo Go doesn't contain this app-local module. Keeping the views optional
// preserves the React Native fallback during development; signed IPA builds
// autolink this module and exclusively use the UIKit controls below.
const nativeButtonModule = requireOptionalNativeModule("NativeLiquidButton");
const nativeSegmentedModule = requireOptionalNativeModule("NativeLiquidSegmented");
const nativeTabBarModule = requireOptionalNativeModule("NativeLiquidTabBar");
const nativeSelectorModule = requireOptionalNativeModule("NativeLiquidSelector");

export const NativeLiquidButton: ComponentType<NativeLiquidButtonProps> | null = nativeButtonModule
  ? requireNativeView<NativeLiquidButtonProps>("NativeLiquidButton")
  : null;

export const NativeLiquidSegmented: ComponentType<NativeLiquidSegmentedProps> | null = nativeSegmentedModule
  ? requireNativeView<NativeLiquidSegmentedProps>("NativeLiquidSegmented")
  : null;

export const NativeLiquidTabBar: ComponentType<NativeLiquidTabBarProps> | null = nativeTabBarModule
  ? requireNativeView<NativeLiquidTabBarProps>("NativeLiquidTabBar")
  : null;

export const NativeLiquidSelector: ComponentType<NativeLiquidSelectorProps> | null = nativeSelectorModule
  ? requireNativeView<NativeLiquidSelectorProps>("NativeLiquidSelector")
  : null;
