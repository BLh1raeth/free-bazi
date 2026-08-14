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

// Expo Go doesn't contain this app-local module. Keeping the views optional
// preserves the React Native fallback during development; signed IPA builds
// autolink this module and exclusively use the UIKit controls below.
const nativeModule = requireOptionalNativeModule("NativeLiquidControls");

export const NativeLiquidButton: ComponentType<NativeLiquidButtonProps> | null = nativeModule
  ? requireNativeView<NativeLiquidButtonProps>("NativeLiquidControls", "NativeLiquidButton")
  : null;

export const NativeLiquidSegmented: ComponentType<NativeLiquidSegmentedProps> | null = nativeModule
  ? requireNativeView<NativeLiquidSegmentedProps>("NativeLiquidControls", "NativeLiquidSegmented")
  : null;

export const NativeLiquidTabBar: ComponentType<NativeLiquidTabBarProps> | null = nativeModule
  ? requireNativeView<NativeLiquidTabBarProps>("NativeLiquidControls", "NativeLiquidTabBar")
  : null;
