import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize } from "../lib/tokens";

interface Props {
  rating: number;
  total?: number;
  size?: number;
  showCount?: boolean;
}

export function Rating({ rating, total, size = 14, showCount = false }: Props) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = rating >= i + 1;
    const half = rating >= i + 0.5 && rating < i + 1;
    return { filled, half };
  });

  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {stars.map((star, i) => (
          <Ionicons
            key={i}
            name={star.filled ? "star" : star.half ? "star-half" : "star-outline"}
            size={size}
            color={star.filled || star.half ? colors.warning : colors.border}
          />
        ))}
      </View>
      {showCount && total !== undefined && (
        <Text style={styles.count}>({total})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  count: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: 2,
  },
});
