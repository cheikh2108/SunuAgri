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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    apiFetch<{ data: Field[] }>("/api/fields").then(({ data, error: err }) => {
      if (err) setError(err);
      else setFields(data?.data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Foncier agricole</Text>
        <Text style={styles.sub}>Terres disponibles au Sénégal</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : fields.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune annonce disponible</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {fields.map((f) => (
            <Pressable
              key={f.id}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
              onPress={() => router.push(`/(app)/field/${f.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Champ ${f.title}, ${f.region}`}
            >
              {/* Bande colorée latérale */}
              <View style={styles.cardAccent} />
              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{f.title}</Text>
                  <Text style={styles.cardBadge}>
                    {OP_LABELS[f.operationType] ?? f.operationType}
                  </Text>
                </View>
                <Text style={styles.cardLocation}>
                  📍 {f.region} · {f.commune}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardArea}>{f.areaSqm} ha</Text>
                  {f.price && (
                    <Text style={styles.cardPrice}>
                      {f.price.toLocaleString("fr-SN")} F XOF
                    </Text>
                  )}
                </View>
                <Text style={styles.cardOwner}>Par {f.profile.displayName}</Text>
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
    backgroundColor: colors.primary,
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
    color: colors.primary,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: "hidden",
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
  cardArea: {
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
