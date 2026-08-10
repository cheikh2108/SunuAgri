import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from "react-native";
import { colors, spacing, radius, fontSize, fontWeight } from "../lib/tokens";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";

interface Props extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Button({
  label,
  variant = "primary",
  loading = false,
  size = "md",
  style,
  disabled,
  ...rest
}: Props) {
  const bg = {
    primary: colors.primary,
    secondary: colors.secondary,
    outline: "transparent",
    ghost: "transparent",
    destructive: colors.destructive,
  }[variant];

  const textColor = {
    primary: colors.white,
    secondary: colors.white,
    outline: colors.primary,
    ghost: colors.textSecondary,
    destructive: colors.white,
  }[variant];

  const height = { sm: 40, md: 52, lg: 58 }[size];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[
        styles.base,
        { backgroundColor: bg, height, borderRadius: radius.md },
        variant === "outline" && styles.outlined,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            { color: textColor, fontSize: size === "sm" ? fontSize.sm : fontSize.base },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.1,
  },
});
