import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../src/contexts/ThemeContext";
import { spacing, fontSize, fontWeight, radius } from "../../src/lib/tokens";
import { useState } from "react";

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, setMode, isDark, colors } = useTheme();
  const [themeSelectorVisible, setThemeSelectorVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(["auth_token", "active_profile", "hasCompletedOnboarding"]);
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const getThemeLabel = () => {
    if (mode === "light") return "Clair";
    if (mode === "dark") return "Sombre";
    return "Automatique";
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Paramètres</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Apparence */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPARENCE</Text>

          <Pressable
            style={[styles.item, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
            onPress={() => setThemeSelectorVisible(!themeSelectorVisible)}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="contrast-outline" size={22} color={colors.primary} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Thème</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={[styles.itemValue, { color: colors.textMuted }]}>{getThemeLabel()}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </Pressable>

          {themeSelectorVisible && (
            <View style={[styles.themeSelector, { backgroundColor: colors.surfaceAlt }]}>
              {[
                { value: "light" as const, label: "Clair", icon: "sunny" },
                { value: "dark" as const, label: "Sombre", icon: "moon" },
                { value: "auto" as const, label: "Automatique", icon: "phone-portrait" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.themeOption,
                    mode === option.value && { backgroundColor: colors.primary + "20" },
                  ]}
                  onPress={() => {
                    setMode(option.value);
                    setThemeSelectorVisible(false);
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={mode === option.value ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeOptionLabel,
                      {
                        color: mode === option.value ? colors.primary : colors.text,
                        fontWeight: mode === option.value ? fontWeight.semibold : fontWeight.regular,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {mode === option.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>NOTIFICATIONS</Text>

          <View style={[styles.item, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.itemLeft}>
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Notifications push</Text>
            </View>
            <Text style={[styles.itemValue, { color: colors.textMuted }]}>Activées</Text>
          </View>
        </View>

        {/* Compte */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>COMPTE</Text>

          <Pressable
            style={[styles.item, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
            onPress={() => router.push("/(app)/favorites")}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="heart-outline" size={22} color={colors.primary} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Mes favoris</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.item, { backgroundColor: colors.surface }]}
            onPress={() => router.push("/(app)/help")}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
              <Text style={[styles.itemLabel, { color: colors.text }]}>Aide & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Pressable
            style={[styles.item, styles.logoutButton, { backgroundColor: colors.destructiveLight }]}
            onPress={handleLogout}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="log-out-outline" size={22} color={colors.destructive} />
              <Text style={[styles.itemLabel, { color: colors.destructive, fontWeight: fontWeight.semibold }]}>
                Déconnexion
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textMuted }]}>SunuAgri v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  content: {
    padding: spacing.base,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.md,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  itemLabel: {
    fontSize: fontSize.base,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemValue: {
    fontSize: fontSize.sm,
  },
  themeSelector: {
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  themeOptionLabel: {
    flex: 1,
    fontSize: fontSize.base,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  version: {
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
