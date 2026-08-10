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
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "../../../src/lib/api";
import { Button } from "../../../src/components/Button";
import { colors, spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";

interface ProductionDetail {
  id: string;
  name: string;
  category: string;
  variety?: string;
  offerType: string;
  region: string;
  commune?: string;
  quantityAvailable: number;
  quantityUnit: string;
  price: number;
  minOrderQty?: number;
  quality?: string;
  harvestDate?: string;
  availableUntil?: string;
  deliveryConditions?: string;
  description?: string;
  profile: {
    displayName: string;
    verificationLevels: string[];
  };
}

const OFFER_LABELS: Record<string, string> = {
  AVAILABLE_NOW: "Disponible maintenant",
  HARVEST_IN_PROGRESS: "Récolte en cours",
  AVAILABLE_SOON: "Bientôt disponible",
  PREORDER: "Précommande",
  WHOLESALE: "Vente en gros",
  RETAIL: "Vente au détail",
  SUPPLY_CONTRACT: "Contrat d'approvisionnement",
  PROCESSED: "Produit transformé",
  ORGANIC: "Bio / certifié",
};

export default function ProductionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [prod, setProd] = useState<ProductionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    apiFetch<ProductionDetail>(`/api/productions/${id}`).then(({ data }) => {
      setProd(data);
      setLoading(false);
    });
  }, [id]);

  async function handlePurchaseRequest() {
    setRequesting(true);
    const { error } = await apiFetch(`/api/productions/${id}/purchase-requests`, {
      method: "POST",
      body: JSON.stringify({
        quantity: prod?.minOrderQty ?? 1,
        unit: prod?.quantityUnit,
        proposedPrice: prod?.price,
        message: "Je suis intéressé par cette production.",
      }),
    });
    setRequesting(false);
    if (error) Alert.alert("Erreur", error);
    else Alert.alert("Demande envoyée", "Le producteur a été notifié.");
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.secondary} size="large" />
      </View>
    );
  }

  if (!prod) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: colors.textMuted }}>Production introuvable</Text>
      </View>
    );
  }

  const isVerified = prod.profile.verificationLevels.includes("ID_VERIFIED");

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityLabel="Retour">
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{OFFER_LABELS[prod.offerType] ?? prod.offerType}</Text>
          </View>
          <Text style={styles.heroTitle}>{prod.name}</Text>
          <Text style={styles.heroSub}>
            {prod.category}{prod.variety ? ` · ${prod.variety}` : ""} · 📍 {prod.region}
          </Text>
        </View>

        <View style={styles.body}>
          {/* Prix & quantité */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {prod.price.toLocaleString("fr-SN")} F
              </Text>
              <Text style={styles.statLabel}>par {prod.quantityUnit}</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {prod.quantityAvailable}
              </Text>
              <Text style={styles.statLabel}>{prod.quantityUnit} disponibles</Text>
            </View>
          </View>

          {/* Détails */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails</Text>
            <View style={styles.detailRows}>
              {prod.quality && <DetailRow label="Qualité" value={prod.quality} />}
              {prod.minOrderQty && (
                <DetailRow label="Commande min." value={`${prod.minOrderQty} ${prod.quantityUnit}`} />
              )}
              {prod.harvestDate && (
                <DetailRow
                  label="Date de récolte"
                  value={new Date(prod.harvestDate).toLocaleDateString("fr-SN")}
                />
              )}
              {prod.availableUntil && (
                <DetailRow
                  label="Disponible jusqu'au"
                  value={new Date(prod.availableUntil).toLocaleDateString("fr-SN")}
                />
              )}
              {prod.deliveryConditions && (
                <DetailRow label="Livraison" value={prod.deliveryConditions} />
              )}
            </View>
          </View>

          {prod.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.bodyText}>{prod.description}</Text>
            </View>
          )}

          {/* Producteur */}
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerAvatarText}>
                {prod.profile.displayName[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{prod.profile.displayName}</Text>
              <Text style={styles.ownerSub}>
                {isVerified ? "✓ Identité vérifiée" : "Producteur"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CTA fixe bas */}
      <View style={styles.cta}>
        <Button
          label="Envoyer une demande"
          onPress={handlePurchaseRequest}
          loading={requesting}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { fontSize: fontSize.sm, color: colors.textMuted },
  value: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text, flex: 1, textAlign: "right" },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    backgroundColor: colors.secondary,
    paddingTop: 52,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  backIcon: { fontSize: 22, color: colors.white },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  heroBadgeText: { fontSize: fontSize.xs, color: colors.white, fontWeight: fontWeight.semibold },
  heroTitle: { fontSize: fontSize["2xl"], fontWeight: fontWeight.black, color: colors.white, lineHeight: 30 },
  heroSub: { fontSize: fontSize.sm, color: colors.white, opacity: 0.85 },
  body: { padding: spacing.base, gap: spacing.lg, paddingBottom: 100 },
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
  statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.black, color: colors.secondary },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statDiv: { width: 1, backgroundColor: colors.border },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.text },
  detailRows: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  bodyText: { fontSize: fontSize.base, color: colors.textSecondary, lineHeight: 22 },
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
    backgroundColor: colors.secondary,
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
  },
});
