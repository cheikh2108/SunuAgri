import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput as RNTextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "../../../src/lib/api";
import { Button, ImageGallery, Badge, SkeletonLoader, Toast, TextInput } from "../../../src/components";
import { colors, spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";
import { Ionicons } from "@expo/vector-icons";
import { getActiveProfile, ActiveProfile } from "../../../src/lib/active-profile";
import { shareAnnonce } from "../../../src/lib/share";

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
    id: string;
    displayName: string;
    verificationLevels: string[];
  };
  medias?: { url: string; mediaType: string }[];
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
  const [contacting, setContacting] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(null);

  // Modal state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");

  // Toast state
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "error" }>({
    visible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    Promise.all([
      apiFetch<ProductionDetail>(`/api/productions/${id}`),
      getActiveProfile(),
    ]).then(([{ data }, profile]) => {
      setProd(data);
      setActiveProfile(profile);
      setLoading(false);
    });
  }, [id]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  const openPurchaseModal = () => {
    setQuantity(String(prod?.minOrderQty ?? 1));
    setMessage("Je suis intéressé par cette production.");
    setShowPurchaseModal(true);
  };

  async function handlePurchaseRequest() {
    if (!quantity || Number(quantity) <= 0) {
      showToast("Veuillez entrer une quantité valide", "error");
      return;
    }

    setRequesting(true);
    const { error } = await apiFetch(`/api/productions/${id}/purchase-requests`, {
      method: "POST",
      body: JSON.stringify({
        quantity: Number(quantity),
        unit: prod?.quantityUnit,
        proposedPrice: prod?.price,
        message: message.trim() || "Je suis intéressé par cette production.",
      }),
    });
    setRequesting(false);

    if (error) {
      showToast(error, "error");
    } else {
      setShowPurchaseModal(false);
      showToast("Demande envoyée avec succès", "success");
    }
  }

  async function handleContactProducer() {
    if (!prod?.profile.id) return;

    setContacting(true);
    const { data, error } = await apiFetch<{ conversationId: string }>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ participantId: prod.profile.id }),
    });
    setContacting(false);

    if (error) {
      showToast(error, "error");
    } else if (data?.conversationId) {
      router.push(`/(app)/conversation/${data.conversationId}`);
    }
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={{ height: 280, backgroundColor: colors.border }}>
          <SkeletonLoader width="100%" height={280} borderRadius={0} />
        </View>
        <View style={{ padding: spacing.base, gap: spacing.md }}>
          <SkeletonLoader width="80%" height={24} />
          <SkeletonLoader width="60%" height={16} />
          <SkeletonLoader width="100%" height={100} />
        </View>
      </View>
    );
  }

  if (!prod) {
    return (
      <View style={styles.screen}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.base }}>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.base }}>Production introuvable</Text>
        </View>
      </View>
    );
  }

  const isVerified = prod.profile.verificationLevels.includes("ID_VERIFIED");
  const imageUrls = prod.medias?.filter((m) => m.mediaType === "image").map((m) => m.url) ?? [];
  const isOwnProduction = activeProfile?.id === prod.profile.id;

  return (
    <View style={styles.screen}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Galerie d'images */}
        <ImageGallery images={imageUrls} placeholder="production" />

        {/* Boutons flottants */}
        <Pressable
          onPress={() => router.back()}
          style={styles.floatingBackBtn}
          hitSlop={12}
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={() =>
            shareAnnonce({
              type: "production",
              id: production.id,
              title: production.name,
              price: production.price,
              location: production.region,
            })
          }
          style={styles.floatingShareBtn}
          hitSlop={12}
          accessibilityLabel="Partager"
        >
          <Ionicons name="share-social-outline" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Badge
                label={OFFER_LABELS[prod.offerType] ?? prod.offerType}
                variant="secondary"
                size="md"
                style={{ alignSelf: "flex-start", marginBottom: spacing.sm }}
              />
              <Text style={styles.title}>{prod.name}</Text>
              <Text style={styles.subtitle}>
                {prod.category}{prod.variety ? ` · ${prod.variety}` : ""}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.location}>{prod.region}</Text>
              </View>
            </View>
          </View>
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
          <Pressable
            style={styles.ownerCard}
            onPress={() => router.push(`/(app)/profile/${prod.profile.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Voir le profil de ${prod.profile.displayName}`}
          >
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
          </Pressable>
        </View>
      </ScrollView>

      {/* CTA fixe bas - uniquement si l'utilisateur n'est pas le producteur */}
      {!isOwnProduction && (
        <View style={styles.cta}>
          <Button
            label="Demander un achat"
            onPress={openPurchaseModal}
            loading={requesting}
            style={{ flex: 1 }}
          />
          <Button
            label="Contacter"
            onPress={handleContactProducer}
            loading={contacting}
            variant="outline"
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* Modal de demande d'achat */}
      <Modal
        visible={showPurchaseModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPurchaseModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Demande d'achat</Text>
              <Pressable
                onPress={() => setShowPurchaseModal(false)}
                hitSlop={12}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Quantité ({prod?.quantityUnit})
                </Text>
                <RNTextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder={`Min. ${prod?.minOrderQty ?? 1}`}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message (optionnel)</Text>
                <RNTextInput
                  style={[styles.input, styles.textArea]}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  placeholder="Décrivez votre demande..."
                  placeholderTextColor={colors.textMuted}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalActions}>
                <Button
                  label="Annuler"
                  onPress={() => setShowPurchaseModal(false)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Envoyer"
                  onPress={handlePurchaseRequest}
                  loading={requesting}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  floatingBackBtn: {
    position: "absolute",
    top: 50,
    left: spacing.base,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  floatingShareBtn: {
    position: "absolute",
    top: 50,
    right: spacing.base,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  content: { padding: spacing.base, gap: spacing.lg, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.text,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
  },
  location: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
    flexDirection: "row",
    gap: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalBody: {
    padding: spacing.base,
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.sm,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
