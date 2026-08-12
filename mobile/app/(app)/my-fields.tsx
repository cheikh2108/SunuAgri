import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "../../src/lib/api";
import { ImageCard, EmptyState, Badge, Toast } from "../../src/components";
import { colors, spacing, fontSize, fontWeight, radius } from "../../src/lib/tokens";
import { Ionicons } from "@expo/vector-icons";

interface Field {
  id: string;
  title: string;
  operationType: string;
  status: "DRAFT" | "PENDING_VALIDATION" | "PUBLISHED" | "REJECTED" | "EXPIRED" | "SUSPENDED" | "ARCHIVED";
  region: string;
  commune: string;
  areaSqm: number;
  areaUnit: string;
  price?: number;
  medias?: { url: string; mediaType: string }[];
}

type FilterStatus = "ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_VALIDATION: "En attente",
  PUBLISHED: "Publiée",
  REJECTED: "Rejetée",
  EXPIRED: "Expirée",
  SUSPENDED: "Suspendue",
  ARCHIVED: "Archivée",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "neutral" | "destructive"> = {
  DRAFT: "neutral",
  PENDING_VALIDATION: "warning",
  PUBLISHED: "success",
  REJECTED: "destructive",
  EXPIRED: "neutral",
  SUSPENDED: "destructive",
  ARCHIVED: "neutral",
};

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

export default function MyFieldsScreen() {
  const router = useRouter();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "error" }>({
    visible: false,
    message: "",
    type: "success",
  });
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  const fetchFields = useCallback(async () => {
    const statusParam = filter === "ALL" ? "" : `&status=${filter}`;
    const { data, error } = await apiFetch<{ data: Field[] }>(`/api/fields?mine=true${statusParam}`);

    if (error) {
      showToast(error, "error");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setFields(data?.data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ visible: true, message, type });
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchFields();
  }

  function handleFieldPress(field: Field) {
    router.push(`/field/${field.id}`);
  }

  function handleActionsPress(field: Field) {
    setSelectedField(field);
    setActionMenuVisible(true);
  }

  function handleEdit() {
    if (selectedField) {
      setActionMenuVisible(false);
      router.push(`/field/edit/${selectedField.id}`);
    }
  }

  function handleDelete() {
    if (!selectedField) return;

    Alert.alert(
      "Supprimer cette annonce",
      "Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setActionMenuVisible(false);
            const { error } = await apiFetch(`/api/fields/${selectedField.id}`, {
              method: "DELETE",
            });

            if (error) {
              showToast(error, "error");
            } else {
              showToast("Annonce supprimée", "success");
              fetchFields();
            }
          },
        },
      ]
    );
  }

  function handleViewStats() {
    setActionMenuVisible(false);
    showToast("Statistiques à venir", "success");
  }

  function renderField({ item }: { item: Field }) {
    const imageUrl = item.medias?.[0]?.url;
    const priceText = item.price
      ? `${item.price.toLocaleString("fr-SN")} FCFA`
      : undefined;

    return (
      <View style={styles.fieldItem}>
        <ImageCard
          imageUrl={imageUrl}
          title={item.title}
          subtitle={OP_LABELS[item.operationType] ?? item.operationType}
          location={`${item.commune}, ${item.region}`}
          metadata={`${item.areaSqm} ${item.areaUnit}`}
          price={priceText}
          onPress={() => handleFieldPress(item)}
        />
        <View style={styles.fieldFooter}>
          <Badge
            label={STATUS_LABELS[item.status] ?? item.status}
            variant={STATUS_VARIANTS[item.status] ?? "neutral"}
            size="md"
          />
          <Pressable
            onPress={() => handleActionsPress(item)}
            hitSlop={12}
            style={styles.actionsBtn}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>
    );
  }

  function renderEmpty() {
    const title = filter === "ALL"
      ? "Aucune annonce"
      : `Aucune annonce ${filter === "PUBLISHED" ? "publiée" : filter === "DRAFT" ? "en brouillon" : "archivée"}`;

    return (
      <EmptyState
        icon="file-tray-outline"
        title={title}
        description="Publiez votre première annonce de terrain"
        actionLabel="Créer une annonce"
        onAction={() => router.push("/field/create")}
      />
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Mes annonces</Text>
        </View>
        <View style={styles.loading}>
          <Text style={{ color: colors.textMuted }}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes annonces</Text>
        <Pressable
          onPress={() => router.push("/field/create")}
          style={styles.addBtn}
          hitSlop={12}
        >
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        <FilterTab
          label="Toutes"
          active={filter === "ALL"}
          onPress={() => setFilter("ALL")}
        />
        <FilterTab
          label="Publiées"
          active={filter === "PUBLISHED"}
          onPress={() => setFilter("PUBLISHED")}
        />
        <FilterTab
          label="Brouillons"
          active={filter === "DRAFT"}
          onPress={() => setFilter("DRAFT")}
        />
        <FilterTab
          label="Archivées"
          active={filter === "ARCHIVED"}
          onPress={() => setFilter("ARCHIVED")}
        />
      </View>

      {/* List */}
      <FlatList
        data={fields}
        renderItem={renderField}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          fields.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Actions Menu Modal */}
      <Modal
        visible={actionMenuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActionMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Actions</Text>

            <Pressable style={styles.menuItem} onPress={handleEdit}>
              <Ionicons name="pencil-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Modifier</Text>
            </Pressable>

            <Pressable style={styles.menuItem} onPress={handleViewStats}>
              <Ionicons name="stats-chart-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Voir les statistiques</Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable style={styles.menuItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              <Text style={[styles.menuItemText, { color: colors.destructive }]}>
                Supprimer
              </Text>
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => setActionMenuVisible(false)}>
              <Text style={[styles.menuItemText, { color: colors.textMuted }]}>
                Annuler
              </Text>
            </Pressable>
          </View>
        </Pressable>
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

function FilterTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.text,
  },
  addBtn: {
    padding: spacing.xs,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: colors.successLight,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  list: {
    padding: spacing.base,
    gap: spacing.md,
  },
  listEmpty: {
    flex: 1,
  },
  fieldItem: {
    gap: spacing.sm,
  },
  fieldFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  actionsBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
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
    padding: spacing.lg,
    gap: spacing.xs,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  menuItemText: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
});
