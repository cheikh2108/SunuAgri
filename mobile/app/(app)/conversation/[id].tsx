import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  AppState,
  AppStateStatus,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "../../../src/lib/api";
import { spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { getActiveProfileId } from "../../../src/lib/active-profile";
import { EmptyState, Toast } from "../../../src/components";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderProfile: { id: string; displayName: string; photoUrl?: string };
}

interface Participant {
  profile: { id: string; displayName: string; photoUrl?: string };
}

interface ConversationDetail {
  id: string;
  participants: Participant[];
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const flatRef = useRef<FlatList>(null);

  async function fetchConversation() {
    const profileId = await getActiveProfileId();
    setCurrentProfileId(profileId);

    const { data: conversationsData, error: convError } = await apiFetch<ConversationDetail[]>(
      `/api/conversations`
    );

    if (convError) {
      setError(convError);
      setLoading(false);
      return;
    }

    const conv = conversationsData?.find((c) => c.id === id);
    if (!conv) {
      setError("Conversation introuvable");
      setLoading(false);
      return;
    }

    const { data: messagesData, error: messagesError } = await apiFetch<Message[]>(
      `/api/conversations/${id}/messages`
    );

    if (messagesError) {
      setError(messagesError);
      setLoading(false);
      return;
    }

    setConversation(conv);
    if (messagesData) setMessages(messagesData);
    setLoading(false);
  }

  useEffect(() => {
    fetchConversation();

    let interval: NodeJS.Timeout | null = null;
    let appStateListener: any = null;

    const startPolling = () => {
      if (interval) return; // Éviter les doublons
      // Polling toutes les 15s (au lieu de 5s) pour économiser batterie/data
      interval = setInterval(() => {
        if (!sending && AppState.currentState === 'active') {
          apiFetch<Message[]>(`/api/conversations/${id}/messages`).then(({ data }) => {
            if (data) setMessages(data);
          });
        }
      }, 15000);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    // Gérer le changement d'état de l'app
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        startPolling();
      } else {
        stopPolling(); // Arrêter le polling en background
      }
    };

    appStateListener = AppState.addEventListener('change', handleAppStateChange);
    startPolling();

    return () => {
      stopPolling();
      appStateListener?.remove();
    };
  }, [id, sending]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    const msg = text.trim();
    setText("");
    setSending(true);

    const { error: sendError } = await apiFetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: msg }),
    });

    setSending(false);

    if (sendError) {
      setError(sendError);
      setText(msg);
      return;
    }

    const { data: messagesData } = await apiFetch<Message[]>(
      `/api/conversations/${id}/messages`
    );
    if (messagesData) {
      setMessages(messagesData);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  const otherParticipant = conversation?.participants.find(
    (p) => p.profile.id !== currentProfileId
  );
  const other = otherParticipant?.profile?.displayName ?? "Discussion";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.screen}>
        <Toast
          visible={!!error}
          message={error ?? ""}
          type="error"
          onHide={() => setError(null)}
        />

        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
            accessibilityLabel="Retour"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{other[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.headerName} numberOfLines={1}>
            {other}
          </Text>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="chatbubble-outline"
              title="Aucun message"
              description="Démarrez la conversation en envoyant un message"
            />
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item: m }) => {
              const isMine = m.senderProfile?.id === currentProfileId;
              return (
                <View
                  style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}
                >
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                    {m.content}
                  </Text>
                  <View style={styles.bubbleFooter}>
                    <Text
                      style={[
                        styles.bubbleTime,
                        isMine && { color: "rgba(255,255,255,0.7)" },
                      ]}
                    >
                      {new Date(m.createdAt).toLocaleTimeString("fr-SN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {isMine && (
                      <View style={styles.checkmarks}>
                        <Ionicons
                          name="checkmark-done"
                          size={16}
                          color={m.isRead ? "#4FC3F7" : "rgba(255,255,255,0.7)"}
                        />
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            multiline
            maxLength={1000}
            style={styles.textInput}
            editable={!sending}
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            accessibilityLabel="Envoyer"
            accessibilityRole="button"
          >
            {sending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Ionicons name="send" size={20} color={colors.white} />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingTop: 52,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  headerName: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  messageList: {
    padding: spacing.base,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 20,
  },
  bubbleTextMine: { color: colors.white },
  bubbleFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    marginTop: 2,
  },
  bubbleTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  checkmarks: {
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: 28,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
});
