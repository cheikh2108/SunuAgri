import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { spacing, fontSize, fontWeight, radius } from "../lib/tokens";

interface MyListingCardProps {
  imageUrl?: string;
  title: string;
  status: string;
  statusLabel: string;
  statusVariant: "success" | "warning" | "neutral" | "destructive";
  badge?: string;
  location: string;
  metadata: string;
  price?: string;
  onPress: () => void;
  onActionsPress: () => void;
}

export function MyListingCard({
  imageUrl,
  title,
  status,
  statusLabel,
  statusVariant,
  badge,
  location,
  metadata,
  price,
  onPress,
  onActionsPress,
}: MyListingCardProps) {
  const { colors } = useTheme();

  const statusColors = {
    success: colors.success,
    warning: colors.warning,
    neutral: colors.textMuted,
    destructive: colors.destructive,
  };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
            <Ionicons name="image-outline" size={32} color={colors.textMuted} />
          </View>
        )}

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColors[statusVariant] }]}>
          <Text style={[styles.statusText, { color: colors.white }]}>{statusLabel}</Text>
        </View>

        {/* Actions button */}
        <Pressable
          onPress={onActionsPress}
          style={[styles.actionsBtn, { backgroundColor: colors.surface }]}
          hitSlop={12}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
        </View>

        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{badge}</Text>
          </View>
        )}

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
              {location}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="resize-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{metadata}</Text>
          </View>
        </View>

        {price && (
          <Text style={[styles.price, { color: colors.primary }]}>{price}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  imageContainer: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    position: "absolute",
    top: spacing.xs,
    left: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  actionsBtn: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    lineHeight: 20,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  meta: {
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  price: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
});
