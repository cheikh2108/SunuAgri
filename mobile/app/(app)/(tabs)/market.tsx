import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "../../../src/lib/api";
import { ImageCard, SearchBar, SkeletonCard, EmptyState } from "../../../src/components";
import { colors, spacing, fontSize, fontWeight } from "../../../src/lib/tokens";

interface Production {
  id: string;
  name: string;
  category: string;
  offerType: string;
  region: string;
  quantityAvailable: number;
  quantityUnit: string;
  price: number;
  profile: { displayName: string };
}

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

export default function MarketScreen() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [filteredProductions, setFilteredProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    apiFetch<{ data: Production[] }>("/api/productions").then(({ data, error: err }) => {
      if (err) setError(err);
      else {
        setProductions(data?.data ?? []);
        setFilteredProductions(data?.data ?? []);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProductions(productions);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = productions.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.region.toLowerCase().includes(query)
    );
    setFilteredProductions(filtered);
  }, [searchQuery, productions]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Marché agricole</Text>
        <Text style={styles.sub}>Productions disponibles</Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        showFilter
        onFilterPress={() => {}}
      />

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
      ) : filteredProductions.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={searchQuery ? "Aucun résultat" : "Aucune production disponible"}
          description={searchQuery ? "Essayez avec d'autres mots-clés" : "Revenez plus tard pour voir les nouvelles offres"}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {filteredProductions.map((p) => (
            <ImageCard
              key={p.id}
              title={p.name}
              subtitle={p.category}
              badge={OFFER_LABELS[p.offerType] ?? p.offerType}
              badgeVariant="secondary"
              location={p.region}
              metadata={`${p.quantityAvailable} ${p.quantityUnit}`}
              price={`${p.price.toLocaleString("fr-SN")} F / ${p.quantityUnit}`}
              owner={p.profile.displayName}
              onPress={() => router.push(`/(app)/production/${p.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
