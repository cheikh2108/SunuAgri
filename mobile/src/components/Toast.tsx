import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, fontSize, fontWeight } from "../lib/tokens";

type ToastType = "success" | "error" | "info" | "warning";

interface Props {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide?: () => void;
  duration?: number;
}

export function Toast({ message, type = "info", visible, onHide, duration = 3000 }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onHide?.());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, translateY, duration, onHide]);

  if (!visible) return null;

  const config = {
    success: {
      bg: colors.successLight,
      color: colors.success,
      icon: "checkmark-circle" as const,
    },
    error: {
      bg: colors.destructiveLight,
      color: colors.destructive,
      icon: "close-circle" as const,
    },
    warning: {
      bg: colors.warningLight,
      color: colors.warning,
      icon: "warning" as const,
    },
    info: {
      bg: colors.surfaceAlt,
      color: colors.text,
      icon: "information-circle" as const,
    },
  }[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.bg, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: spacing.base,
    right: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
