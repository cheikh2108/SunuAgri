import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../../../src/lib/api";
import { ImageCard, SearchBar, SkeletonCard, EmptyState, Picker } from "../../../src/components";
import { colors, spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";
import { useFavorites } from "../../../src/hooks/useFavorites";

interface Field {
  id: string;
  title: string;
  operationType: string;
  region: string;
  commune: string;
  areaSqm: number;
  price?: number;
  profile: { displayName: string };
  medias?: { url: string; thumbnailUrl?: string }[];
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

const REGIONS = [
  { label: "Toutes les régions", value: "" },
  { label: "Dakar", value: "Dakar" },
  { label: "Thiès", value: "Thiès" },
  { label: "Saint-Louis", value: "Saint-Louis" },
  { label: "Diourbel", value: "Diourbel" },
  { label: "Louga", value: "Louga" },
  { label: "Fatick", value: "Fatick" },
  { label: "Kaolack", value: "Kaolack" },
  { label: "Matam", value: "Matam" },
  { label: "Tambacounda", value: "Tambacounda" },
  { label: "Kaffrine", value: "Kaffrine" },
  { label: "Kédougou", value: "Kédougou" },
  { label: "Kolda", value: "Kolda" },
  { label: "Sédhiou", value: "Sédhiou" },
  { label: "Ziguinchor", value: "Ziguinchor" },
];

const OPERATION_TYPES = Object.keys(OP_LABELS).map((key) => ({
  label: OP_LABELS[key],
  value: key,
}));

interface Filters {
  region: string;
  operationTypes: string[];
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
}

export default function FieldsScreen() {
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    region: "",
    operationTypes: [],
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
  });
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();

  async function loadFields() {
    const { data, error: err } = await apiFetch<{ data: Field[] }>("/api/fields");
    if (err) setError(err);
    else {
      setFields(data?.data ?? []);
      setFilteredFields(data?.data ?? []);
    }
    setLoading(false);
    setRefreshing(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadFields();
  }

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    let filtered = fields;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.region.toLowerCase().includes(query) ||
          f.commune.toLowerCase().includes(query)
      );
    }

    // Apply region filter
    if (filters.region) {
      filtered = filtered.filter((f) => f.region === filters.region);
    }

    // Apply operation type filter
    if (filters.operationTypes.length > 0) {
      filtered = filtered.filter((f) =>
        filters.operationTypes.includes(f.operationType)
      );
    }

    // Apply price filters
    const minPrice = parseFloat(filters.minPrice);
    const maxPrice = parseFloat(filters.maxPrice);
    if (!isNaN(minPrice)) {
      filtered = filtered.filter((f) => (f.price ?? 0) >= minPrice);
    }
    if (!isNaN(maxPrice)) {
      filtered = filtered.filter((f) => (f.price ?? 0) <= maxPrice);
    }

    // Apply area filters
    const minArea = parseFloat(filters.minArea);
    const maxArea = parseFloat(filters.maxArea);
    if (!isNaN(minArea)) {
      filtered = filtered.filter((f) => f.areaSqm >= minArea);
    }
    if (!isNaN(maxArea)) {
      filtered = filtered.filter((f) => f.areaSqm <= maxArea);
    }

    setFilteredFields(filtered);
  }, [searchQuery, fields, filters]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.region) count++;
    if (filters.operationTypes.length > 0) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minArea || filters.maxArea) count++;
    return count;
  };

  const resetFilters = () => {
    setFilters({
      region: "",
      operationTypes: [],
      minPrice: "",
      maxPrice: "",
      minArea: "",
      maxArea: "",
    });
  };

  const toggleOperationType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      operationTypes: prev.operationTypes.includes(type)
        ? prev.operationTypes.filter((t) => t !== type)
        : [...prev.operationTypes, type],
    }));
  };

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
        filterCount={getActiveFilterCount()}
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
      ) : filteredFields.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={searchQuery ? "Aucun résultat" : "Aucune annonce disponible"}
          description={searchQuery ? "Essayez avec d'autres mots-clés" : "Revenez plus tard pour voir les nouvelles offres"}
        />
      ) : (
        <FlatList
          data={filteredFields}
          keyExtractor={(item) => item.id}
          renderItem={({ item: f }) => {
            const imageUrl = f.medias?.[0]?.thumbnailUrl || f.medias?.[0]?.url;
            return (
              <ImageCard
                imageUrl={imageUrl}
                title={f.title}
                badge={OP_LABELS[f.operationType] ?? f.operationType}
                badgeVariant="primary"
                location={`${f.region} · ${f.commune}`}
                metadata={`${f.areaSqm} ha`}
                price={f.price ? `${f.price.toLocaleString("fr-SN")} F` : undefined}
                owner={f.profile.displayName}
                onPress={() => router.push(`/(app)/field/${f.id}`)}
                isFavorite={isFavorite("field", f.id)}
                onFavoritePress={() => toggleFavorite("field", f.id)}
              />
            );
          }}
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
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/(app)/field/create')}
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
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Picker
                  label="Région"
                  placeholder="Toutes les régions"
                  value={filters.region}
                  options={REGIONS}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, region: value }))
                  }
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Type d'opération</Text>
                <View style={styles.checkboxGroup}>
                  {OPERATION_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={styles.checkboxItem}
                      onPress={() => toggleOperationType(type.value)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          filters.operationTypes.includes(type.value) &&
                            styles.checkboxChecked,
                        ]}
                      >
                        {filters.operationTypes.includes(type.value) && (
                          <Ionicons name="checkmark" size={16} color={colors.white} />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Fourchette de prix (FCFA)</Text>
                <View style={styles.rangeRow}>
                  <View style={styles.rangeInput}>
                    <Text style={styles.rangeInputLabel}>Min</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      keyboardType="numeric"
                      value={filters.minPrice}
                      onChangeText={(value) =>
                        setFilters((prev) => ({ ...prev, minPrice: value }))
                      }
                    />
                  </View>
                  <Text style={styles.rangeSeparator}>—</Text>
                  <View style={styles.rangeInput}>
                    <Text style={styles.rangeInputLabel}>Max</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="∞"
                      keyboardType="numeric"
                      value={filters.maxPrice}
                      onChangeText={(value) =>
                        setFilters((prev) => ({ ...prev, maxPrice: value }))
                      }
                    />
                  </View>
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Superficie (hectares)</Text>
                <View style={styles.rangeRow}>
                  <View style={styles.rangeInput}>
                    <Text style={styles.rangeInputLabel}>Min</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      keyboardType="numeric"
                      value={filters.minArea}
                      onChangeText={(value) =>
                        setFilters((prev) => ({ ...prev, minArea: value }))
                      }
                    />
                  </View>
                  <Text style={styles.rangeSeparator}>—</Text>
                  <View style={styles.rangeInput}>
                    <Text style={styles.rangeInputLabel}>Max</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="∞"
                      keyboardType="numeric"
                      value={filters.maxArea}
                      onChangeText={(value) =>
                        setFilters((prev) => ({ ...prev, maxArea: value }))
                      }
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  resetFilters();
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>Appliquer</Text>
              </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.base,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  checkboxGroup: {
    gap: spacing.sm,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: fontSize.base,
    color: colors.text,
    flex: 1,
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rangeInput: {
    flex: 1,
  },
  rangeInputLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    fontWeight: fontWeight.semibold,
  },
  rangeSeparator: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    paddingTop: 20,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  modalFooter: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  resetButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  applyButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
