import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../../../src/hooks/useAuth";
import { apiFetch } from "../../../src/lib/api";
import { Button } from "../../../src/components/Button";
import { colors, spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";

interface Profile {
  id: string;
  displayName: string;
  type: string;
  verificationLevels: string[];
  _count: { fields: number; productions: number };
}

const TYPE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire foncier",
  PRODUCER: "Producteur",
  BUYER: "Acheteur",
  INVESTOR: "Investisseur",
  SERVICE_PROVIDER: "Prestataire",
  AGENT: "Agent SunuAgri",
  ADMIN: "Administrateur",
};

const VERIF_LABELS: Record<string, string> = {
  PHONE_VERIFIED: "📱 Téléphone vérifié",
  EMAIL_VERIFIED: "✉️ Email vérifié",
  ID_VERIFIED: "🪪 Identité vérifiée",
  ORG_VERIFIED: "🏢 Organisation vérifiée",
  LOCATION_VERIFIED: "📍 Localisation vérifiée",
  FIELD_VISIT: "✅ Visite terrain",
};

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ profiles: Profile[] }>("/api/profile/me").then(({ data }) => {
      setProfiles(data?.profiles ?? []);
      setLoading(false);
    });
  }, []);

  function handleLogout() {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Déconnexion", style: "destructive", onPress: logout },
      ]
    );
  }

  const profile = profiles[0];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.heading}>Mon profil</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <>
          {profile && (
            <>
              {/* Avatar + identité */}
              <View style={styles.card}>
                <View style={styles.avatarRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarLetter}>
                      {profile.displayName[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.name}>{profile.displayName}</Text>
                    <Text style={styles.role}>
                      {TYPE_LABELS[profile.type] ?? profile.type}
                    </Text>
                  </View>
                </View>

                {/* Niveaux de vérification */}
                {profile.verificationLevels.length > 0 && (
                  <View style={styles.badges}>
                    {profile.verificationLevels.map((v) => (
                      <View key={v} style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {VERIF_LABELS[v] ?? v}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Statistiques */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{profile._count.fields}</Text>
                  <Text style={styles.statLabel}>Champs</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{profile._count.productions}</Text>
                  <Text style={styles.statLabel}>Productions</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.actions}>
            <Button
              label="Se déconnecter"
              variant="outline"
              onPress={handleLogout}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: 40 },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 56,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.base,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.white,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  role: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  actions: {
    marginHorizontal: spacing.base,
    marginTop: spacing.xl,
  },
});
