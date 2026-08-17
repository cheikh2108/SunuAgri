import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "../../../src/components/Button";
import { TextInput } from "../../../src/components/TextInput";
import { Picker } from "../../../src/components/Picker";
import { ImagePickerField } from "../../../src/components/ImagePickerField";
import { apiFetch } from "../../../src/lib/api";
import { spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";
import { useTheme } from "../../src/contexts/ThemeContext";

const REGIONS = [
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

const BUYER_TYPES = [
  { label: "Particulier", value: "Particulier" },
  { label: "Restaurant", value: "Restaurant" },
  { label: "Hôtel", value: "Hôtel" },
  { label: "Grossiste", value: "Grossiste" },
  { label: "Transformateur", value: "Transformateur" },
  { label: "Exportateur", value: "Exportateur" },
  { label: "Autre", value: "Autre" },
];

const PRODUCT_INTERESTS = [
  "Légumes",
  "Fruits",
  "Céréales",
  "Tubercules",
  "Viande",
  "Volaille",
  "Œufs",
  "Lait",
  "Poisson",
  "Miel",
];

export default function OnboardingBuyerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [displayName, setDisplayName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [buyerType, setBuyerType] = useState("");
  const [region, setRegion] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function toggleProduct(product: string) {
    setSelectedProducts((prev) =>
      prev.includes(product) ? prev.filter((p) => p !== product) : [...prev, product]
    );
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = "Le nom est requis";
    }
    if (!region) {
      newErrors.region = "La région est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);

    const payload: any = {
      type: "BUYER",
      displayName: displayName.trim(),
      region,
    };

    // N'inclure les champs optionnels que s'ils existent
    if (buyerType) payload.buyerType = buyerType;
    if (selectedProducts.length > 0) payload.productInterests = selectedProducts;

    // TODO: implémenter l'upload de photo plus tard

    const { data, error } = await apiFetch<{ profile: { id: string } }>(
      "/api/profiles",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    setLoading(false);

    if (error || !data) {
      setErrors({ submit: error ?? "Erreur lors de la création du profil" });
      return;
    }

    await AsyncStorage.setItem("activeProfileId", data.profile.id);
    await AsyncStorage.setItem("hasCompletedOnboarding", "true");

    router.replace("/(app)/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Button
          label="← Retour"
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          style={{ alignSelf: "flex-start", marginBottom: spacing.md }}
        />

        <Text style={styles.heading}>🛒 Profil Acheteur</Text>
        <Text style={styles.sub}>
          Complétez votre profil pour acheter des produits agricoles
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Nom complet ou entreprise *"
            placeholder="Fatou Ba"
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (errors.displayName) {
                setErrors((prev) => ({ ...prev, displayName: "" }));
              }
            }}
            error={errors.displayName}
            autoComplete="name"
            returnKeyType="next"
          />

          <ImagePickerField
            label="Photo de profil"
            value={photoUri}
            onValueChange={setPhotoUri}
          />

          <Picker
            label="Type d'acheteur"
            placeholder="Sélectionner un type"
            value={buyerType}
            options={BUYER_TYPES}
            onValueChange={setBuyerType}
          />

          <Picker
            label="Région *"
            placeholder="Sélectionner une région"
            value={region}
            options={REGIONS}
            onValueChange={(value) => {
              setRegion(value);
              if (errors.region) {
                setErrors((prev) => ({ ...prev, region: "" }));
              }
            }}
            error={errors.region}
          />

          <View>
            <Text style={styles.label}>Produits recherchés</Text>
            <Text style={styles.hint}>
              Sélectionnez les types de produits qui vous intéressent (optionnel)
            </Text>
            <View style={styles.chipsContainer}>
              {PRODUCT_INTERESTS.map((product) => (
                <TouchableOpacity
                  key={product}
                  style={[
                    styles.chip,
                    selectedProducts.includes(product) && styles.chipSelected,
                  ]}
                  onPress={() => toggleProduct(product)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selectedProducts.includes(product) }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedProducts.includes(product) && styles.chipTextSelected,
                    ]}
                  >
                    {product}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {errors.submit && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} accessibilityRole="alert">
                {errors.submit}
              </Text>
            </View>
          )}

          <Button
            label="Créer mon profil"
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.base,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing["2xl"],
  },
  form: {
    gap: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.white,
  },
  errorBox: {
    backgroundColor: colors.destructiveLight,
    borderRadius: 10,
    padding: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.destructive,
  },
});
