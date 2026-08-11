import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, radius } from "../lib/tokens";

interface Props {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "primary" | "secondary";
  location?: string;
  price?: string;
  metadata?: string;
  owner?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ImageCard({
  imageUrl,
  title,
  subtitle,
  badge,
  badgeVariant = "primary",
  location,
  price,
  metadata,
  owner,
  onPress,
  style,
}: Props) {
  const placeholderColor = badgeVariant === "primary" ? colors.primary : colors.secondary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}
      accessibilityRole="button"
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: placeholderColor }]}>
            <Ionicons
              name={badgeVariant === "primary" ? "leaf-outline" : "nutrition-outline"}
              size={40}
              color={colors.white}
              style={{ opacity: 0.5 }}
            />
          </View>
        )}
        {badge && (
          <View
            style={[
              styles.badgeContainer,
              { backgroundColor: badgeVariant === "primary" ? colors.successLight : colors.warningLight },
            ]}
          >
            <Text
              style={[
                styles.badge,
                { color: badgeVariant === "primary" ? colors.primary : colors.secondary },
              ]}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}

        {location && (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          {metadata && <Text style={styles.metadata}>{metadata}</Text>}
          {price && <Text style={styles.price}>{price}</Text>}
        </View>

        {owner && <Text style={styles.owner} numberOfLines={1}>Par {owner}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  imageContainer: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContainer: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badge: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  metadata: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  price: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  owner: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
