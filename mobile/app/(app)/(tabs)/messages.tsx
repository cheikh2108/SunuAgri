import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "../../../src/lib/api";
import { EmptyState, SkeletonLoader } from "../../../src/components";
import { colors, spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";
import { Ionicons } from "@expo/vector-icons";

interface Conversation {
  id: string;
  updatedAt: string;
  participants: { profile: { displayName: string } }[];
  messages: { content: string; createdAt: string }[];
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch<Conversation[]>("/api/conversations").then(({ data }) => {
      setConversations(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Messages</Text>
      </View>

      {loading ? (
        <View style={{ padding: spacing.base, gap: spacing.md }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.item}>
              <SkeletonLoader width={44} height={44} borderRadius={radius.full} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonLoader width="60%" height={16} />
                <SkeletonLoader width="80%" height={14} />
              </View>
            </View>
          ))}
        </View>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="Aucune conversation"
          description="Contactez un propriétaire ou producteur pour démarrer une discussion"
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {conversations.map((c) => {
            const other = c.participants[0]?.profile?.displayName ?? "—";
            const last = c.messages[0];
            return (
              <Pressable
                key={c.id}
                style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
                onPress={() => router.push(`/(app)/conversation/${c.id}`)}
                accessibilityRole="button"
              >
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{other}</Text>
                  {last && (
                    <Text style={styles.preview} numberOfLines={1}>
                      {last.content}
                    </Text>
                  )}
                </View>
                {last && (
                  <Text style={styles.time}>
                    {new Date(last.createdAt).toLocaleDateString("fr-SN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 56,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.text,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  info: { flex: 1 },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  preview: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 1,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
});
