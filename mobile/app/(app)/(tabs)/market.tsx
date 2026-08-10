import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "../../../src/lib/api";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    apiFetch<{ data: Production[] }>("/api/productions").then(({ data, error: err }) => {
      if (err) setError(err);
      else setProductions(data?.data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Marché agricole</Text>
        <Text style={styles.sub}>Productions disponibles</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.secondary} style={{ marginTop: 48 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : productions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune production disponible</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {productions.map((p) => (
            <Pressable
              key={p.id}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
              onPress={() => router.push(`/(app)/production/${p.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}, ${p.quantityAvailable} ${p.quantityUnit}`}
            >
              <View style={styles.cardAccent} />
              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.cardBadge}>
                    {OFFER_LABELS[p.offerType] ?? p.offerType}
                  </Text>
                </View>
                <Text style={styles.cardCategory}>{p.category}</Text>
                <Text style={styles.cardLocation}>📍 {p.region}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardQty}>
                    {p.quantityAvailable} {p.quantityUnit}
                  </Text>
                  <Text style={styles.cardPrice}>
                    {p.price.toLocaleString("fr-SN")} F / {p.quantityUnit}
                  </Text>
                </View>
                <Text style={styles.cardOwner}>Par {p.profile.displayName}</Text>
              </View>
            </Pressable>
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
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardAccent: {
    width: 4,
    backgroundColor: colors.secondary,
  },
  cardBody: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  cardBadge: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.secondary,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  cardCategory: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardLocation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  cardQty: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  cardPrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  cardOwner: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
  },
  errorText: {
    textAlign: "center",
    marginTop: 48,
    color: colors.destructive,
    fontSize: fontSize.sm,
  },
});
