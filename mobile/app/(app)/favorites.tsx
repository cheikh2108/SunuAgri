import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useFavorites } from "../../src/hooks/useFavorites";
import { ImageCard, EmptyState, SkeletonCard } from "../../src/components";
import { spacing, fontSize, fontWeight, radius } from "../../src/lib/tokens";
import { OPERATION_TYPES } from "../../src/lib/constants";

const OFFER_LABELS: Record<string, string> = {
  AVAILABLE_NOW: "Disponible",
  HARVEST_IN_PROGRESS: "Récolte en cours",
  AVAILABLE_SOON: "Bientôt disponible",
  PRE_ORDER: "Précommande",
  WHOLESALE: "Vente en gros",
  RETAIL: "Vente au détail",
  SUPPLY_CONTRACT: "Contrat",
  PROCESSED_PRODUCT: "Transformé",
  ORGANIC_CERTIFIED: "Bio / certifié",
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const { favorites, loading, error, toggleFavorite, reload } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const handleFavoriteToggle = async (type: "field" | "production", id: string) => {
    await toggleFavorite(type, id);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Mes favoris</Text>
        <Text style={styles.sub}>{favorites.length} annonce{favorites.length > 1 ? "s" : ""}</Text>
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Erreur de chargement"
          description={error}
        />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Aucun favori"
          description="Ajoutez des annonces à vos favoris pour les retrouver facilement ici"
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {favorites.map((fav) => {
            if (fav.field) {
              const field = fav.field;
              const imageUrl = field.medias?.[0]?.thumbnailUrl || field.medias?.[0]?.url;
              const opLabel =
                OPERATION_TYPES[field.operationType as keyof typeof OPERATION_TYPES] ||
                field.operationType;

              return (
                <ImageCard
                  key={fav.id}
                  imageUrl={imageUrl}
                  title={field.title}
                  subtitle={opLabel}
                  badge={opLabel}
                  badgeVariant="primary"
                  location={`${field.region}, ${field.commune}`}
                  metadata={`${field.areaSqm.toLocaleString("fr-SN")} m²`}
                  price={`${field.price.toLocaleString("fr-SN")} F CFA`}
                  owner={field.profile.displayName}
                  onPress={() => router.push(`/(app)/field/${field.id}`)}
                  isFavorite={true}
                  onFavoritePress={() => handleFavoriteToggle("field", field.id)}
                />
              );
            }

            if (fav.production) {
              const prod = fav.production;
              const imageUrl = prod.medias?.[0]?.thumbnailUrl || prod.medias?.[0]?.url;
              const offerLabel = OFFER_LABELS[prod.offerType] || prod.offerType;

              return (
                <ImageCard
                  key={fav.id}
                  imageUrl={imageUrl}
                  title={prod.name}
                  subtitle={prod.category}
                  badge={offerLabel}
                  badgeVariant="secondary"
                  location={prod.region}
                  metadata={`${prod.quantityAvailable} ${prod.quantityUnit}`}
                  price={`${prod.price.toLocaleString("fr-SN")} F / ${prod.quantityUnit}`}
                  owner={prod.profile.displayName}
                  onPress={() => router.push(`/(app)/production/${prod.id}`)}
                  isFavorite={true}
                  onFavoritePress={() => handleFavoriteToggle("production", prod.id)}
                />
              );
            }

            return null;
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
    backgroundColor: colors.primary,
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
});
