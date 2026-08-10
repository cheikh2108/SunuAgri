import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "../../../src/lib/api";
import { Button } from "../../../src/components/Button";
import { colors, spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";

interface FieldDetail {
  id: string;
  title: string;
  description?: string;
  operationType: string;
  region: string;
  department: string;
  commune: string;
  locality?: string;
  areaSqm: number;
  price?: number;
  negotiable: boolean;
  soilType?: string;
  waterAccess: boolean;
  roadAccess: boolean;
  documentTypes: string[];
  status: string;
  profile: {
    id: string;
    displayName: string;
    verificationLevels: string[];
    _count: { fields: number };
  };
  visitRequests?: { status: string }[];
  // GPS révélé seulement après acceptation de visite
  latitude?: number;
  longitude?: number;
}

const OP_LABELS: Record<string, string> = {
  SEASONAL_RENT: "Location saisonnière",
  ANNUAL_RENT: "Location annuelle",
  LONG_TERM_RENT: "Location longue durée",
  SALE: "Vente",
  SHARECROPPING: "Métayage",
  HARVEST_SHARE: "Partage de récolte",
  EXPLOITATION_PARTNERSHIP: "Partenariat d'exploitation",
  INVESTOR_SEARCH: "Recherche d'investisseur",
  CONVENTIONAL_PROVISION: "Mise à disposition",
};

export default function FieldDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [field, setField] = useState<FieldDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    apiFetch<FieldDetail>(`/api/fields/${id}`).then(({ data }) => {
      setField(data);
      setLoading(false);
    });
  }, [id]);

  async function handleVisitRequest() {
    // Date par défaut : demain
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    setRequesting(true);
    const { error } = await apiFetch(`/api/fields/${id}/visit-requests`, {
      method: "POST",
      body: JSON.stringify({
        requestedDate: tomorrow,
        visitorCount: 1,
        message: "Je souhaite visiter ce champ.",
      }),
    });
    setRequesting(false);
    if (error) Alert.alert("Erreur", error);
    else Alert.alert("Demande envoyée", "Le propriétaire a été notifié.");
  }

  function handleWhatsApp(phone?: string | null) {
    if (!phone) return;
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}`);
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!field) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: colors.textMuted }}>Champ introuvable</Text>
      </View>
    );
  }

  const hasVisitAccepted = field.visitRequests?.some((v) => v.status === "ACCEPTED");
  const isVerifiedOwner = field.profile.verificationLevels.includes("ID_VERIFIED");

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header coloré */}
        <View style={styles.hero}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
            accessibilityLabel="Retour"
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>
              {OP_LABELS[field.operationType] ?? field.operationType}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{field.title}</Text>
          <Text style={styles.heroLocation}>
            📍 {field.commune}, {field.region}
          </Text>
        </View>

        <View style={styles.body}>
          {/* Prix & surface */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{field.areaSqm} ha</Text>
              <Text style={styles.statLabel}>Superficie</Text>
            </View>
            {field.price && (
              <>
                <View style={styles.statDiv} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {field.price.toLocaleString("fr-SN")} F
                  </Text>
                  <Text style={styles.statLabel}>
                    Prix {field.negotiable ? "(négociable)" : ""}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* GPS masqué / révélé */}
          <View style={styles.gpsCard}>
            {hasVisitAccepted && field.latitude ? (
              <>
                <Text style={styles.sectionTitle}>📍 Localisation exacte</Text>
                <Text style={styles.gpsCoords}>
                  {field.latitude.toFixed(6)}, {field.longitude?.toFixed(6)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.gpsHidden}>🔒 Position exacte masquée</Text>
                <Text style={styles.gpsHint}>
                  Faites une demande de visite pour obtenir les coordonnées GPS
                </Text>
              </>
            )}
          </View>

          {/* Description */}
          {field.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.body_text}>{field.description}</Text>
            </View>
          )}

          {/* Caractéristiques */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caractéristiques</Text>
            <View style={styles.chips}>
              {field.waterAccess && <Chip label="💧 Eau disponible" />}
              {field.roadAccess && <Chip label="🛣️ Accès routier" />}
              {field.soilType && <Chip label={`🌱 Sol ${field.soilType}`} />}
            </View>
          </View>

          {/* Disclaimer juridique — CLAUDE.md §5 */}
          {field.documentTypes.length > 0 && (
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerTitle}>📋 Documents déclarés</Text>
              <Text style={styles.disclaimerText}>
                {field.documentTypes.join(", ")}
              </Text>
              <Text style={styles.disclaimerWarning}>
                ⚠️ Ces documents sont déclarés par le propriétaire. SunuAgri ne certifie pas leur validité juridique. Les vérifications restent à la charge des parties.
              </Text>
            </View>
          )}

          {/* Propriétaire */}
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerAvatarText}>
                {field.profile.displayName[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{field.profile.displayName}</Text>
              <Text style={styles.ownerSub}>
                {field.profile._count.fields} annonce{field.profile._count.fields > 1 ? "s" : ""}
                {isVerifiedOwner ? "  ✓ Identité vérifiée" : ""}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CTA fixe en bas — thumb zone */}
      <View style={styles.cta}>
        <Button
          label="Demander une visite"
          onPress={handleVisitRequest}
          loading={requesting}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={chipStyles.chip}>
      <Text style={chipStyles.text}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    backgroundColor: colors.primary,
    paddingTop: 52,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  backIcon: { fontSize: 22, color: colors.white },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  heroBadgeText: { fontSize: fontSize.xs, color: colors.white, fontWeight: fontWeight.semibold },
  heroTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.white,
    lineHeight: 30,
  },
  heroLocation: { fontSize: fontSize.sm, color: colors.white, opacity: 0.85 },
  body: {
    padding: spacing.base,
    gap: spacing.lg,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.black, color: colors.primary },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statDiv: { width: 1, backgroundColor: colors.border },
  gpsCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  gpsHidden: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  gpsHint: { fontSize: fontSize.sm, color: colors.textMuted },
  gpsCoords: { fontSize: fontSize.base, color: colors.primary, fontWeight: fontWeight.semibold },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.text },
  body_text: { fontSize: fontSize.base, color: colors.textSecondary, lineHeight: 22 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  disclaimer: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  disclaimerText: { fontSize: fontSize.sm, color: colors.text },
  disclaimerWarning: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 18 },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerAvatarText: { fontSize: fontSize.lg, fontWeight: fontWeight.black, color: colors.white },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  ownerSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    gap: spacing.md,
  },
});
