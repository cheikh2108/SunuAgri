export const colors = {
  primary: "#2D6A35",       // vert SunuAgri profond
  primaryLight: "#4A9955",
  secondary: "#C98A1A",     // ambre
  secondaryLight: "#E8B84B",
  background: "#F5F7F3",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF2EB",
  border: "#D8E3D4",
  text: "#1A2E1D",
  textSecondary: "#5A7060",
  textMuted: "#8FA893",
  destructive: "#C0392B",
  destructiveLight: "#FDECEA",
  success: "#2D6A35",
  successLight: "#E8F5E9",
  warning: "#C98A1A",
  warningLight: "#FFF8E1",
  overlay: "rgba(0,0,0,0.5)",
  white: "#FFFFFF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  "2xl": 30,
  "3xl": 38,
} as const;

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  black: "900" as const,
};
