import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "../../../src/lib/api";
import { ImageCard, SearchBar, SkeletonCard, EmptyState } from "../../../src/components";
import { colors, spacing, fontSize, fontWeight } from "../../../src/lib/tokens";

interface Field {
  id: string;
  title: string;
  operationType: string;
  region: string;
  commune: string;
  areaSqm: number;
  price?: number;
  profile: { displayName: string };
}

const OP_LABELS: Record<string, string> = {
  SEASONAL_RENT: "Location saisonnière",
  ANNUAL_RENT: "Location annuelle",
  LONG_TERM_RENT: "Location longue durée",
  SALE: "Vente",
  SHARECROPPING: "Métayage",
  HARVEST_SHARE: "Partage de récolte",
  EXPLOITATION_PARTNERSHIP: "Partenariat",
  INVESTOR_SEARCH: "Recherche investisseur",
  CONVENTIONAL_PROVISION: "Mise à disposition",
};

export default function FieldsScreen() {
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    apiFetch<{ data: Field[] }>("/api/fields").then(({ data, error: err }) => {
      if (err) setError(err);
      else {
        setFields(data?.data ?? []);
        setFilteredFields(data?.data ?? []);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFields(fields);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = fields.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        f.region.toLowerCase().includes(query) ||
        f.commune.toLowerCase().includes(query)
    );
    setFilteredFields(filtered);
  }, [searchQuery, fields]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Foncier agricole</Text>
        <Text style={styles.sub}>Terres disponibles au Sénégal</Text>
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
      ) : filteredFields.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={searchQuery ? "Aucun résultat" : "Aucune annonce disponible"}
          description={searchQuery ? "Essayez avec d'autres mots-clés" : "Revenez plus tard pour voir les nouvelles offres"}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {filteredFields.map((f) => (
            <ImageCard
              key={f.id}
              title={f.title}
              badge={OP_LABELS[f.operationType] ?? f.operationType}
              badgeVariant="primary"
              location={`${f.region} · ${f.commune}`}
              metadata={`${f.areaSqm} ha`}
              price={f.price ? `${f.price.toLocaleString("fr-SN")} F` : undefined}
              owner={f.profile.displayName}
              onPress={() => router.push(`/(app)/field/${f.id}`)}
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
    opacity: 0.75,
    marginTop: 2,
  },
  list: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});
