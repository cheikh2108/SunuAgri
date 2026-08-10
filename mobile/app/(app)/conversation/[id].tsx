import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "../../../src/lib/api";
import { colors, spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderProfile: { id: string; displayName: string };
}

interface ConversationDetail {
  id: string;
  participants: { profile: { id: string; displayName: string } }[];
  messages: Message[];
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  async function fetchMessages() {
    const { data } = await apiFetch<ConversationDetail>(`/api/conversations/${id}/messages`);
    if (data) setConv(data);
    setLoading(false);
  }

  useEffect(() => { fetchMessages(); }, [id]);

  async function handleSend() {
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");
    setSending(true);
    await apiFetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: msg }),
    });
    setSending(false);
    await fetchMessages();
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }

  const other = conv?.participants[0]?.profile?.displayName ?? "Discussion";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Retour">
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{other[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.headerName} numberOfLines={1}>{other}</Text>
        </View>

        {/* Messages */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
        ) : (
          <FlatList
            ref={flatRef}
            data={conv?.messages ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd()}
            renderItem={({ item: m }) => {
              const isMine = m.senderProfile?.id === conv?.participants[1]?.profile?.id;
              return (
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                    {m.content}
                  </Text>
                  <Text style={[styles.bubbleTime, isMine && { color: "rgba(255,255,255,0.7)" }]}>
                    {new Date(m.createdAt).toLocaleTimeString("fr-SN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              );
            }}
          />
        )}

        {/* Saisie — dans la thumb zone */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            accessibilityLabel="Envoyer"
            accessibilityRole="button"
          >
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: colors.text },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.white },
  headerName: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
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
  bubbleTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    alignSelf: "flex-end",
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
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.border },
  sendIcon: { fontSize: 16, color: colors.white },
});
