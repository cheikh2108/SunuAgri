import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { colors, spacing, radius } from "../lib/tokens";

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ width = "100%", height = 20, borderRadius = radius.sm, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonLoader width="100%" height={160} borderRadius={0} />
      <View style={styles.content}>
        <SkeletonLoader width="70%" height={18} />
        <SkeletonLoader width="40%" height={14} style={{ marginTop: spacing.xs }} />
        <SkeletonLoader width="50%" height={14} style={{ marginTop: spacing.sm }} />
        <View style={styles.footer}>
          <SkeletonLoader width={60} height={14} />
          <SkeletonLoader width={80} height={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    padding: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
});
