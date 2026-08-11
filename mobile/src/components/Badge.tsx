import React from "react";
import { Text, StyleSheet, type TextStyle } from "react-native";
import { colors, radius, fontSize, fontWeight } from "../lib/tokens";

type Variant = "primary" | "secondary" | "success" | "warning" | "destructive" | "neutral";

interface Props {
  label: string;
  variant?: Variant;
  size?: "sm" | "md";
  style?: TextStyle;
}

export function Badge({ label, variant = "neutral", size = "sm", style }: Props) {
  const bgColor = {
    primary: colors.successLight,
    secondary: colors.warningLight,
    success: colors.successLight,
    warning: colors.warningLight,
    destructive: colors.destructiveLight,
    neutral: colors.surfaceAlt,
  }[variant];

  const textColor = {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    destructive: colors.destructive,
    neutral: colors.textSecondary,
  }[variant];

  return (
    <Text
      style={[
        styles.base,
        size === "md" && styles.md,
        { backgroundColor: bgColor, color: textColor },
        style,
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  md: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
