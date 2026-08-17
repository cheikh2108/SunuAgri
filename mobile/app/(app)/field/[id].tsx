import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "../../../src/lib/api";
import { Button, ImageGallery, Badge, SkeletonLoader, TextInput, Toast } from "../../../src/components";
import { spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { getActiveProfileId } from "../../../src/lib/active-profile";
import { shareAnnonce } from "../../../src/lib/share";

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
  documentTypes?: string[];
  status: string;
  profile: {
    id: string;
    displayName: string;
    verificationLevels?: string[];
    _count?: { fields: number };
  };
  visitRequests?: { status: string }[];
  medias?: { url: string; mediaType: string }[];
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
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [field, setField] = useState<FieldDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  // Loading states
  const [requestingVisit, setRequestingVisit] = useState(false);
  const [makingOffer, setMakingOffer] = useState(false);
  const [contacting, setContacting] = useState(false);

  // Offer modal
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [visitMessage, setVisitMessage] = useState("");

  // Visit request modal
  const [visitModalVisible, setVisitModalVisible] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "error" }>({
    visible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    Promise.all([
      apiFetch<FieldDetail>(`/api/fields/${id}`),
      getActiveProfileId(),
    ]).then(([fieldRes, profileId]) => {
      setField(fieldRes.data ?? null);
      setCurrentProfileId(profileId);
      setLoading(false);
    });
  }, [id]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ visible: true, message, type });
  }

  async function handleVisitRequest() {
    if (!visitMessage.trim()) {
      showToast("Veuillez saisir un message", "error");
      return;
    }

    setRequestingVisit(true);
    const { error } = await apiFetch(`/api/fields/${id}/visit-requests`, {
      method: "POST",
      body: JSON.stringify({ message: visitMessage }),
    });
    setRequestingVisit(false);

    if (error) {
      showToast(error, "error");
    } else {
      showToast("Demande de visite envoyée", "success");
      setVisitModalVisible(false);
      setVisitMessage("");
    }
  }

  async function handleMakeOffer() {
    if (!offerPrice.trim() || !offerMessage.trim()) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }

    const priceNum = parseFloat(offerPrice.replace(/\s/g, ""));
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("Prix invalide", "error");
      return;
    }

    setMakingOffer(true);
    const { error } = await apiFetch(`/api/fields/${id}/offers`, {
      method: "POST",
      body: JSON.stringify({
        price: priceNum,
        message: offerMessage,
      }),
    });
    setMakingOffer(false);

    if (error) {
      showToast(error, "error");
    } else {
      showToast("Offre envoyée", "success");
      setOfferModalVisible(false);
      setOfferPrice("");
      setOfferMessage("");
    }
  }

  async function handleContact() {
    if (!field?.profile.id) return;

    setContacting(true);
    const { data, error } = await apiFetch<{ id: string }>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ participantId: field.profile.id }),
    });
    setContacting(false);

    if (error) {
      showToast(error, "error");
    } else if (data?.id) {
      router.push(`/(app)/conversation/${data.id}`);
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

  if (!field) {
    return (
      <View style={styles.screen}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.base }}>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.base }}>Champ introuvable</Text>
        </View>
      </View>
    );
  }

  const hasVisitAccepted = field.visitRequests?.some((v) => v.status === "ACCEPTED");
  const isVerifiedOwner = field.profile.verificationLevels?.includes("ID_VERIFIED") ?? false;
  const imageUrls = field.medias?.filter((m) => m.mediaType === "image").map((m) => m.url) ?? [];
  const isOwner = currentProfileId === field.profile.id;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Galerie d'images */}
        <ImageGallery images={imageUrls} placeholder="field" />

        {/* Boutons flottants */}
        <Pressable
          onPress={() => router.back()}
          style={styles.floatingBackBtn}
          hitSlop={12}
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        {/* Bouton partage flottant */}
        <Pressable
          onPress={() =>
            shareAnnonce({
              type: "field",
              id: field.id,
              title: field.title,
              price: field.price,
              location: `${field.region}, ${field.commune}`,
            })
          }
          style={styles.floatingShareBtn}
          hitSlop={12}
          accessibilityLabel="Partager"
        >
          <Ionicons name="share-social-outline" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.content}>
          {/* Header avec badge */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Badge
                label={OP_LABELS[field.operationType] ?? field.operationType}
                variant="primary"
                size="md"
                style={{ alignSelf: "flex-start", marginBottom: spacing.sm }}
              />
              <Text style={styles.title}>{field.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.location}>{field.commune}, {field.region}</Text>
              </View>
            </View>
          </View>

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
                    Prix{field.negotiable ? " (négociable)" : ""}
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
          {field.documentTypes && field.documentTypes.length > 0 && (
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
          <Pressable
            style={styles.ownerCard}
            onPress={() => router.push(`/(app)/profile/${field.profile.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Voir le profil de ${field.profile.displayName}`}
          >
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerAvatarText}>
                {field.profile.displayName[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{field.profile.displayName}</Text>
              <Text style={styles.ownerSub}>
                {field.profile._count?.fields ?? 0} annonce{(field.profile._count?.fields ?? 0) > 1 ? "s" : ""}
                {isVerifiedOwner ? "  ✓ Identité vérifiée" : ""}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* CTA fixe en bas */}
      {!isOwner && (
        <View style={styles.ctaContainer}>
          <View style={styles.ctaRow}>
            <Button
              label="Demander une visite"
              onPress={() => setVisitModalVisible(true)}
              loading={requestingVisit}
              style={{ flex: 1 }}
            />
            <Button
              label="Faire une offre"
              onPress={() => setOfferModalVisible(true)}
              loading={makingOffer}
              variant="secondary"
              style={{ flex: 1 }}
            />
          </View>
          <Button
            label="Contacter le propriétaire"
            onPress={handleContact}
            loading={contacting}
            variant="outline"
          />
        </View>
      )}

      {/* Visit Request Modal */}
      <Modal
        visible={visitModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVisitModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setVisitModalVisible(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Demander une visite</Text>
                <Pressable
                  onPress={() => setVisitModalVisible(false)}
                  hitSlop={12}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <TextInput
                label="Message"
                placeholder="Pourquoi souhaitez-vous visiter ce champ ?"
                value={visitMessage}
                onChangeText={setVisitMessage}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: "top", paddingTop: spacing.md }}
              />

              <View style={styles.modalActions}>
                <Button
                  label="Annuler"
                  onPress={() => setVisitModalVisible(false)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Envoyer"
                  onPress={handleVisitRequest}
                  loading={requestingVisit}
                  style={{ flex: 1 }}
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Offer Modal */}
      <Modal
        visible={offerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setOfferModalVisible(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Faire une offre</Text>
                <Pressable
                  onPress={() => setOfferModalVisible(false)}
                  hitSlop={12}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <TextInput
                label="Prix proposé (FCFA)"
                placeholder="Ex: 5000000"
                value={offerPrice}
                onChangeText={setOfferPrice}
                keyboardType="numeric"
              />

              <TextInput
                label="Message"
                placeholder="Détails de votre offre..."
                value={offerMessage}
                onChangeText={setOfferMessage}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: "top", paddingTop: spacing.md }}
              />

              <View style={styles.modalActions}>
                <Button
                  label="Annuler"
                  onPress={() => setOfferModalVisible(false)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Envoyer"
                  onPress={handleMakeOffer}
                  loading={makingOffer}
                  style={{ flex: 1 }}
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}

function Chip({ label }: { label: string }) {
  const { colors } = useTheme();
  const chipStyles = getChipStyles(colors);
  return (
    <View style={chipStyles.chip}>
      <Text style={chipStyles.text}>{label}</Text>
    </View>
  );
}

const getChipStyles = (colors: any) => StyleSheet.create({
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

const getStyles = (colors: any) => StyleSheet.create({
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
  content: {
    padding: spacing.base,
    gap: spacing.lg,
    paddingBottom: 180,
  },
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
  ctaContainer: {
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
    gap: spacing.sm,
  },
  ctaRow: {
    flexDirection: "row",
    gap: spacing.md,
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
    padding: spacing.lg,
    gap: spacing.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
