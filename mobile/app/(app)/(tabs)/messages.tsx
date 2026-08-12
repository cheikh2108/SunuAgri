import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { apiFetch } from "../../../src/lib/api";
import { EmptyState, SkeletonLoader, Toast } from "../../../src/components";
import { colors, spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";
import { Ionicons } from "@expo/vector-icons";
import { getActiveProfileId } from "../../../src/lib/active-profile";
import { useCallback } from "react";

interface Conversation {
  id: string;
  updatedAt: string;
  participants: { profile: { id: string; displayName: string; photoUrl?: string } }[];
  messages: { content: string; createdAt: string }[];
  unreadCount?: number;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const router = useRouter();

  async function loadConversations() {
    const profileId = await getActiveProfileId();
    setCurrentProfileId(profileId);

    const { data, error } = await apiFetch<Conversation[]>("/api/conversations");

    if (error) {
      setError(error);
    } else {
      setConversations(data ?? []);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  // Recharger automatiquement quand on revient sur cet écran
  useFocusEffect(
    useCallback(() => {
      // Ne pas montrer le loader si on a déjà des données
      if (conversations.length > 0) {
        // Recharger en arrière-plan pour mettre à jour les compteurs de messages non lus
        apiFetch<Conversation[]>("/api/conversations").then(({ data }) => {
          if (data) setConversations(data);
        });
      }
    }, [conversations.length])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadConversations();
  }

  return (
    <View style={styles.screen}>
      <Toast
        visible={!!error}
        message={error ?? ""}
        type="error"
        onHide={() => setError(null)}
      />

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
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {conversations.map((c) => {
            const otherParticipant = c.participants.find(
              (p) => p.profile.id !== currentProfileId
            );
            const other = otherParticipant?.profile?.displayName ?? "—";
            const last = c.messages[0];
            const hasUnread = (c.unreadCount ?? 0) > 0;
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
                  <Text style={[styles.name, hasUnread && styles.nameUnread]}>{other}</Text>
                  {last && (
                    <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>
                      {last.content}
                    </Text>
                  )}
                </View>
                <View style={styles.rightCol}>
                  {last && (
                    <Text style={[styles.time, hasUnread && styles.timeUnread]}>
                      {new Date(last.createdAt).toLocaleDateString("fr-SN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </Text>
                  )}
                  {hasUnread && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{c.unreadCount}</Text>
                    </View>
                  )}
                </View>
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
  nameUnread: {
    fontWeight: fontWeight.black,
    color: colors.text,
  },
  preview: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 1,
  },
  previewUnread: {
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  timeUnread: {
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
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
