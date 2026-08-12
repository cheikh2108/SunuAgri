import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../../src/lib/api";
import { getActiveProfile, ActiveProfile } from "../../src/lib/active-profile";
import {
  MyListingCard,
  EmptyState,
  SkeletonCard,
  Badge,
  Toast,
} from "../../src/components";
import { useTheme } from "../../src/contexts/ThemeContext";
import { spacing, fontSize, fontWeight, radius } from "../../src/lib/tokens";

interface Production {
  id: string;
  name: string;
  category: string;
  offerType: string;
  region: string;
  quantityAvailable: number;
  quantityUnit: string;
  price: number;
  status: string;
  profile: { id: string; displayName: string };
  medias?: { url: string; mediaType: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_VALIDATION: "En attente",
  PUBLISHED: "Publié",
  SUSPENDED: "Suspendu",
  ARCHIVED: "Archivé",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "neutral" | "destructive"> = {
  DRAFT: "neutral",
  PENDING_VALIDATION: "warning",
  PUBLISHED: "success",
  SUSPENDED: "destructive",
  ARCHIVED: "neutral",
};

const OFFER_LABELS: Record<string, string> = {
  AVAILABLE_NOW: "Disponible",
  HARVEST_IN_PROGRESS: "Récolte en cours",
  AVAILABLE_SOON: "Bientôt disponible",
  PREORDER: "Précommande",
  WHOLESALE: "Vente en gros",
  RETAIL: "Vente au détail",
  SUPPLY_CONTRACT: "Contrat",
  PROCESSED: "Transformé",
  ORGANIC: "Bio / certifié",
};

export default function MyProductionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ visible: true, message, type });
  };

  const fetchProductions = useCallback(async () => {
    const profile = await getActiveProfile();
    if (!profile) {
      setLoading(false);
      return;
    }

    setActiveProfile(profile);

    // Use mine=true query parameter to fetch only user's productions
    const { data, error } = await apiFetch<{ data: Production[] }>("/api/productions?mine=true");

    if (error) {
      showToast(error, "error");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setProductions(data?.data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchProductions();
  }, [fetchProductions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProductions();
  }, [fetchProductions]);

  const handleEdit = (id: string) => {
    router.push(`/production/edit/${id}`);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Confirmer la suppression",
      `Voulez-vous vraiment supprimer "${name}" ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const { error } = await apiFetch(`/api/productions/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ action: "archive" }),
            });

            if (error) {
              showToast(error, "error");
            } else {
              showToast("Production supprimée avec succès", "success");
              // Remove from list
              setProductions((prev) => prev.filter((p) => p.id !== id));
            }
          },
        },
      ]
    );
  };

  const handleMarkAsSoldOut = (id: string, name: string) => {
    Alert.alert(
      "Marquer comme épuisé",
      `Marquer "${name}" comme épuisé ? La production ne sera plus visible dans les recherches.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            const { error } = await apiFetch(`/api/productions/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ action: "mark_exhausted" }),
            });

            if (error) {
              showToast(error, "error");
            } else {
              showToast("Production marquée comme épuisée", "success");
              // Update the production in the list
              setProductions((prev) =>
                prev.map((p) => (p.id === id ? { ...p, quantityAvailable: 0 } : p))
              );
            }
          },
        },
      ]
    );
  };

  const showActionsMenu = (production: Production) => {
    const actions = [
      { label: "Modifier", action: () => handleEdit(production.id) },
      {
        label: "Marquer comme épuisé",
        action: () => handleMarkAsSoldOut(production.id, production.name),
      },
      {
        label: "Supprimer",
        action: () => handleDelete(production.id, production.name),
        destructive: true,
      },
      { label: "Annuler", action: () => {}, cancel: true },
    ];

    if (Platform.OS === "ios") {
      Alert.alert(
        production.name,
        "Choisissez une action",
        actions.map((a) => ({
          text: a.label,
          style: a.destructive ? "destructive" : a.cancel ? "cancel" : "default",
          onPress: a.action,
        }))
      );
    } else {
      // Android - use simple menu
      Alert.alert(
        production.name,
        "Choisissez une action",
        actions.map((a) => ({
          text: a.label,
          onPress: a.action,
          style: a.cancel ? "cancel" : "default",
        }))
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.heading}>Mes productions</Text>
          <Text style={styles.sub}>Gérez vos annonces</Text>
        </View>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  if (!activeProfile) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="person-outline"
          title="Profil requis"
          description="Vous devez avoir un profil producteur pour voir vos productions"
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View style={styles.header}>
        <Text style={styles.heading}>Mes productions</Text>
        <Text style={styles.sub}>Gérez vos annonces</Text>
      </View>

      {productions.length === 0 ? (
        <EmptyState
          icon="nutrition-outline"
          title="Aucune production"
          description="Vous n'avez pas encore publié de production. Commencez dès maintenant !"
          actionLabel="Publier une production"
          onAction={() => router.push("/production/create")}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {productions.map((p) => {
            const imageUrl = p.medias?.find((m) => m.mediaType === "image")?.url;
            const priceText = `${p.price.toLocaleString("fr-SN")} F / ${p.quantityUnit}`;

            return (
              <MyListingCard
                key={p.id}
                imageUrl={imageUrl}
                title={p.name}
                status={p.status}
                statusLabel={STATUS_LABELS[p.status] ?? p.status}
                statusVariant={STATUS_VARIANTS[p.status] ?? "neutral"}
                badge={`${p.category} - ${p.offerType}`}
                location={p.region ?? "Localisation non précisée"}
                metadata={`${p.quantityAvailable} ${p.quantityUnit}`}
                price={priceText}
                onPress={() => router.push(`/production/${p.id}`)}
                onActionsPress={() => showActionsMenu(p)}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.secondary,
    paddingTop: 56,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.white,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: fontSize.sm,
    color: colors.white,
    opacity: 0.8,
    marginTop: 2,
  },
  list: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  productionCard: {
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginHorizontal: spacing.sm,
  },
  warningText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    flex: 1,
  },
});
