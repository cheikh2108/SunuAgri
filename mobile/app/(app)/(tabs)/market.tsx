import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../../../src/lib/api";
import { ImageCard, SearchBar, SkeletonCard, EmptyState, Picker, MultiSelect, Button, TextInput } from "../../../src/components";
import { colors, spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";

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

interface Filters {
  region: string;
  categories: string[];
  offerTypes: string[];
  minPrice: string;
  maxPrice: string;
}

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

const REGIONS = [
  { label: "Toutes les régions", value: "" },
  { label: "Dakar", value: "Dakar" },
  { label: "Thiès", value: "Thiès" },
  { label: "Diourbel", value: "Diourbel" },
  { label: "Fatick", value: "Fatick" },
  { label: "Kaolack", value: "Kaolack" },
  { label: "Kaffrine", value: "Kaffrine" },
  { label: "Louga", value: "Louga" },
  { label: "Matam", value: "Matam" },
  { label: "Saint-Louis", value: "Saint-Louis" },
  { label: "Sédhiou", value: "Sédhiou" },
  { label: "Tambacounda", value: "Tambacounda" },
  { label: "Kédougou", value: "Kédougou" },
  { label: "Kolda", value: "Kolda" },
  { label: "Ziguinchor", value: "Ziguinchor" },
];

const CATEGORIES = [
  { label: "Céréales", value: "Céréales" },
  { label: "Légumineuses", value: "Légumineuses" },
  { label: "Légumes", value: "Légumes" },
  { label: "Fruits", value: "Fruits" },
  { label: "Tubercules", value: "Tubercules" },
  { label: "Élevage", value: "Élevage" },
];

const OFFER_TYPES = [
  { label: "Disponible maintenant", value: "AVAILABLE_NOW" },
  { label: "Récolte en cours", value: "HARVEST_IN_PROGRESS" },
  { label: "Bientôt disponible", value: "AVAILABLE_SOON" },
  { label: "Précommande", value: "PRE_ORDER" },
  { label: "Vente en gros", value: "WHOLESALE" },
  { label: "Vente au détail", value: "RETAIL" },
  { label: "Contrat d'approvisionnement", value: "SUPPLY_CONTRACT" },
  { label: "Produit transformé", value: "PROCESSED_PRODUCT" },
  { label: "Bio / certifié", value: "ORGANIC_CERTIFIED" },
];

export default function MarketScreen() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [filteredProductions, setFilteredProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    region: "",
    categories: [],
    offerTypes: [],
    minPrice: "",
    maxPrice: "",
  });
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
    let filtered = productions;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.region.toLowerCase().includes(query)
      );
    }

    // Apply region filter
    if (filters.region) {
      filtered = filtered.filter((p) => p.region === filters.region);
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) => filters.categories.includes(p.category));
    }

    // Apply offer type filter
    if (filters.offerTypes.length > 0) {
      filtered = filtered.filter((p) => filters.offerTypes.includes(p.offerType));
    }

    // Apply price range filter
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter((p) => p.price >= minPrice);
      }
    }
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter((p) => p.price <= maxPrice);
      }
    }

    setFilteredProductions(filtered);
  }, [searchQuery, filters, productions]);

  const activeFilterCount = () => {
    let count = 0;
    if (filters.region) count++;
    if (filters.categories.length > 0) count++;
    if (filters.offerTypes.length > 0) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    return count;
  };

  const resetFilters = () => {
    setFilters({
      region: "",
      categories: [],
      offerTypes: [],
      minPrice: "",
      maxPrice: "",
    });
  };

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
        filterCount={activeFilterCount()}
        onFilterPress={() => setFilterModalVisible(true)}
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
          title={searchQuery || activeFilterCount() > 0 ? "Aucun résultat" : "Aucune production disponible"}
          description={searchQuery || activeFilterCount() > 0 ? "Essayez avec d'autres critères" : "Revenez plus tard pour voir les nouvelles offres"}
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

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/(app)/production/create')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={styles.filterOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable style={styles.filterModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filtres</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
              <Picker
                label="Région"
                value={filters.region}
                options={REGIONS}
                onValueChange={(value) => setFilters({ ...filters, region: value })}
              />

              <MultiSelect
                label="Catégories"
                values={filters.categories}
                options={CATEGORIES}
                onValuesChange={(values) => setFilters({ ...filters, categories: values })}
              />

              <MultiSelect
                label="Types d'offre"
                values={filters.offerTypes}
                options={OFFER_TYPES}
                onValuesChange={(values) => setFilters({ ...filters, offerTypes: values })}
              />

              <View style={styles.priceRange}>
                <Text style={styles.sectionLabel}>Fourchette de prix (F CFA)</Text>
                <View style={styles.priceInputs}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      placeholder="Prix min"
                      value={filters.minPrice}
                      onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={styles.priceSeparator}>-</Text>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      placeholder="Prix max"
                      value={filters.maxPrice}
                      onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterFooter}>
              <TouchableOpacity
                onPress={() => {
                  resetFilters();
                  setFilterModalVisible(false);
                }}
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              <Button
                label="Appliquer"
                onPress={() => setFilterModalVisible(false)}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  filterModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "85%",
    paddingBottom: spacing.base,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  filterContent: {
    padding: spacing.base,
    gap: spacing.base,
  },
  priceRange: {
    gap: spacing.xs,
    marginTop: spacing.base,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  priceInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  priceSeparator: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  filterFooter: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetButton: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  resetButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});
