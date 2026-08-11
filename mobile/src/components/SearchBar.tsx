import React from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, fontSize } from "../lib/tokens";

interface Props extends TextInputProps {
  onFilterPress?: () => void;
  showFilter?: boolean;
}

export function SearchBar({ onFilterPress, showFilter = false, ...rest }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Rechercher..."
          placeholderTextColor={colors.textMuted}
          {...rest}
        />
      </View>
      {showFilter && (
        <Pressable
          onPress={onFilterPress}
          style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Filtres"
        >
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    height: "100%",
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
});
