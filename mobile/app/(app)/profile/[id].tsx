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
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { apiFetch } from "../../../src/lib/api";
import { Button, Badge, Rating, RatingInput, TextInput, SkeletonLoader, EmptyState, Toast, ImageCard } from "../../../src/components";
import { spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";
import { getActiveProfileId } from "../../../src/lib/active-profile";

interface ProfileDetail {
  id: string;
  displayName: string;
  type: string;
  photoUrl?: string;
  bio?: string;
  region?: string;
  commune?: string;
  verificationLevels: string[];
  avgResponseHours?: number;
  createdAt: string;
}

interface ReviewStats {
  count: number;
  averageRating: number;
  reliability: number;
  conformity: number;
  punctuality: number;
  communication: number;
  commitment: number;
}

interface Review {
  id: string;
  reliability: number;
  conformity: number;
  punctuality: number;
  communication: number;
  commitment: number;
  comment?: string;
  createdAt: string;
  authorProfile: {
    id: string;
    displayName: string;
    photoUrl?: string;
    type: string;
  };
}

const TYPE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire foncier",
  PRODUCER: "Producteur",
  BUYER: "Acheteur",
  INVESTOR: "Investisseur",
  PROVIDER: "Prestataire",
};

const VERIF_LABELS: Record<string, string> = {
  PHONE_VERIFIED: "Téléphone vérifié",
  EMAIL_VERIFIED: "Email vérifié",
  ID_VERIFIED: "Identité vérifiée",
  ORG_VERIFIED: "Organisation vérifiée",
  LOCATION_VERIFIED: "Localisation vérifiée",
  FIELD_VISITED: "Visite terrain",
};

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulaire d'avis
  const [reviewForm, setReviewForm] = useState({
    reliability: 0,
    conformity: 0,
    punctuality: 0,
    communication: 0,
    commitment: 0,
    comment: "",
  });

  useEffect(() => {
    loadProfile();
  }, [id]);

  async function loadProfile() {
    setLoading(true);
    const profileId = await getActiveProfileId();
    setCurrentProfileId(profileId);

    const profileRes = await apiFetch<ProfileDetail & { reviews: { count: number; averageRating: number; items: Review[] } }>(`/api/profiles/${id}`);

    if (profileRes.error) {
      setError(profileRes.error);
    } else if (profileRes.data) {
      setProfile(profileRes.data);
      setStats({
        count: profileRes.data.reviews.count,
        averageRating: profileRes.data.reviews.averageRating,
      });
      setReviews(profileRes.data.reviews.items);
    }

    setLoading(false);
  }

  async function handleSubmitReview() {
    const { reliability, conformity, punctuality, communication, commitment, comment } = reviewForm;

    if (!reliability || !conformity || !punctuality || !communication || !commitment) {
      setError("Veuillez noter tous les critères");
      return;
    }

    setSubmitting(true);

    const { error: submitError } = await apiFetch("/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        targetProfileId: id,
        reliability,
        conformity,
        punctuality,
        communication,
        commitment,
        comment: comment.trim() || undefined,
      }),
    });

    setSubmitting(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    setReviewModalVisible(false);
    setReviewForm({
      reliability: 0,
      conformity: 0,
      punctuality: 0,
      communication: 0,
      commitment: 0,
      comment: "",
    });
    loadProfile(); // Recharger pour afficher le nouvel avis
  }

  const isOwnProfile = currentProfileId === id;

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <SkeletonLoader width="100%" height={120} borderRadius={radius.lg} />
          <SkeletonLoader width="60%" height={20} style={{ marginTop: spacing.lg }} />
          <SkeletonLoader width="80%" height={16} />
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="person-outline"
          title="Profil introuvable"
          description="Ce profil n'existe pas ou a été supprimé"
        />
      </View>
    );
  }

  const avgRating = (stats?.reliability || 0 + stats?.conformity || 0 + stats?.punctuality || 0 + stats?.communication || 0 + stats?.commitment || 0) / 5;

  return (
    <View style={styles.screen}>
      <Toast visible={!!error} message={error || ""} type="error" onHide={() => setError(null)} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header flottant */}
        <Pressable
          onPress={() => router.back()}
          style={styles.floatingBackBtn}
          hitSlop={12}
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.content}>
          {/* Carte profil */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.displayName[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{profile.displayName}</Text>
            <Text style={styles.type}>{TYPE_LABELS[profile.type] || profile.type}</Text>

            {profile.region && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.locationText}>
                  {profile.region}
                  {profile.commune && `, ${profile.commune}`}
                </Text>
              </View>
            )}

            {stats && stats.count > 0 && (
              <View style={styles.ratingRow}>
                <Rating rating={stats.averageRating} size={18} />
                <Text style={styles.ratingText}>
                  {stats.averageRating.toFixed(1)} ({stats.count} avis)
                </Text>
              </View>
            )}

            {/* Badges de vérification */}
            {profile.verificationLevels.length > 0 && (
              <View style={styles.badges}>
                {profile.verificationLevels.map((v) => (
                  <Badge key={v} label={VERIF_LABELS[v] || v} variant="success" size="sm" />
                ))}
              </View>
            )}

            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          </View>

          {/* Actions */}
          {!isOwnProfile && (
            <View style={styles.actions}>
              <Button
                label="Contacter"
                onPress={() => router.push(`/(app)/conversation/new?profileId=${profile.id}`)}
                icon="chatbubble-outline"
                style={{ flex: 1 }}
              />
              <Button
                label="Laisser un avis"
                onPress={() => setReviewModalVisible(true)}
                variant="outline"
                icon="star-outline"
                style={{ flex: 1 }}
              />
            </View>
          )}

          {/* Avis */}
          {stats && stats.count > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Avis reçus ({stats.count})</Text>

              {reviews.map((review) => {
                const reviewAvg =
                  (review.reliability +
                    review.conformity +
                    review.punctuality +
                    review.communication +
                    review.commitment) /
                  5;

                return (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAuthor}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>
                            {review.authorProfile.displayName[0]?.toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.reviewAuthorName}>{review.authorProfile.displayName}</Text>
                          <Rating rating={reviewAvg} size={14} />
                        </View>
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString("fr-SN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                    </View>

                    {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                  </View>
                );
              })}
            </View>
          )}

          {stats && stats.count === 0 && (
            <EmptyState
              icon="star-outline"
              title="Aucun avis"
              description="Ce profil n'a pas encore reçu d'avis"
            />
          )}
        </View>
      </ScrollView>

      {/* Modal avis */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setReviewModalVisible(false)}>
            <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Laisser un avis</Text>
                <Pressable onPress={() => setReviewModalVisible(false)} hitSlop={12}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <RatingInput
                  label="Fiabilité"
                  value={reviewForm.reliability}
                  onChange={(v) => setReviewForm({ ...reviewForm, reliability: v })}
                  required
                />
                <RatingInput
                  label="Conformité"
                  value={reviewForm.conformity}
                  onChange={(v) => setReviewForm({ ...reviewForm, conformity: v })}
                  required
                />
                <RatingInput
                  label="Ponctualité"
                  value={reviewForm.punctuality}
                  onChange={(v) => setReviewForm({ ...reviewForm, punctuality: v })}
                  required
                />
                <RatingInput
                  label="Communication"
                  value={reviewForm.communication}
                  onChange={(v) => setReviewForm({ ...reviewForm, communication: v })}
                  required
                />
                <RatingInput
                  label="Engagement"
                  value={reviewForm.commitment}
                  onChange={(v) => setReviewForm({ ...reviewForm, commitment: v })}
                  required
                />

                <TextInput
                  label="Commentaire (optionnel)"
                  placeholder="Partagez votre expérience..."
                  value={reviewForm.comment}
                  onChangeText={(text) => setReviewForm({ ...reviewForm, comment: text })}
                  multiline
                  numberOfLines={4}
                  style={{ height: 100, textAlignVertical: "top", paddingTop: spacing.md }}
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button
                  label="Annuler"
                  onPress={() => setReviewModalVisible(false)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Publier"
                  onPress={handleSubmitReview}
                  loading={submitting}
                  style={{ flex: 1 }}
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

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
  content: { padding: spacing.base, paddingTop: 100, gap: spacing.lg },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: fontSize["2xl"], fontWeight: fontWeight.black, color: colors.white },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.black, color: colors.text },
  type: { fontSize: fontSize.sm, color: colors.textSecondary },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: fontSize.sm, color: colors.textSecondary },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  ratingText: { fontSize: fontSize.sm, color: colors.textMuted },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  bio: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  actions: { flexDirection: "row", gap: spacing.md },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  reviewAuthor: { flexDirection: "row", gap: spacing.sm, flex: 1 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.white },
  reviewAuthorName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  reviewDate: { fontSize: fontSize.xs, color: colors.textMuted },
  reviewComment: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  modalContent: { padding: spacing.base, gap: spacing.base },
  modalFooter: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
