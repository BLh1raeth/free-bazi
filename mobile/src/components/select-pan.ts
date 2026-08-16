import { useMemo, useRef } from "react";
import { PanResponder, type LayoutChangeEvent } from "react-native";
import * as Haptics from "expo-haptics";

/**
 Horizontal drag-to-switch for single-choice bars: dragging across the bar
 selects the segment under the finger, like the system tab bar. The layout is
 still pure React Native, so the web preview matches the native position.
 */
export function useHorizontalSelectPan<T extends string>(
  options: Array<{ value: T; label: string }>,
  onChange: (value: T) => void,
) {
  const width = useRef(1);
  const last = useRef<T | null>(null);
  const pan = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 5 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
      onPanResponderMove: (evt) => {
        const count = options.length;
        if (count <= 0 || width.current <= 0) return;
        const index = Math.max(0, Math.min(count - 1, Math.floor(evt.nativeEvent.locationX / (width.current / count))));
        const option = options[index];
        if (option && option.value !== last.current) {
          last.current = option.value;
          void Haptics.selectionAsync();
          onChange(option.value);
        }
      },
      onPanResponderRelease: () => { last.current = null; },
      onPanResponderTerminate: () => { last.current = null; },
    }),
    [options, onChange],
  );
  return {
    panHandlers: pan.panHandlers,
    onLayout: (event: LayoutChangeEvent) => {
      width.current = event.nativeEvent.layout.width;
    },
  };
}
