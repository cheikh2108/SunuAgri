import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight } from "../lib/tokens";

interface Props {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}

export function RatingInput({ label, value, onChange, required }: Props) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={8}
            accessibilityLabel={`${star} étoile${star > 1 ? "s" : ""}`}
            accessibilityRole="button"
          >
            <Ionicons
              name={value >= star ? "star" : "star-outline"}
              size={32}
              color={value >= star ? colors.warning : colors.border}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  required: {
    color: colors.destructive,
  },
  stars: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
