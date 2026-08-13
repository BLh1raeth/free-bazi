export const palette = {
  background: "#F7F9FE",
  surface: "rgba(249, 251, 255, 0.78)",
  surfaceStrong: "rgba(252, 253, 255, 0.94)",
  white: "#FFFFFF",
  primary: "#173D82",
  accent: "#1769E0",
  text: "#15366F",
  muted: "#7387A8",
  line: "rgba(63, 112, 190, 0.12)",
  lineStrong: "rgba(55, 108, 195, 0.23)",
  shadow: "#7898CC",
  success: "#4E9D55",
  danger: "#C34A3F",
  neutral: "#8190A8",
  clash: "#D4872D",
  punish: "#8154B8",
  harm: "#B45F78",
  break: "#5E7E9E",
} as const;

export const elementColors = {
  木: "#36953E",
  火: "#C44635",
  土: "#8A5E45",
  金: "#C78A12",
  水: "#1769C9",
} as const;

export type ElementName = keyof typeof elementColors;

export const radii = {
  small: 10,
  medium: 14,
  large: 18,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  glass: {
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 15,
    elevation: 5,
  },
} as const;
