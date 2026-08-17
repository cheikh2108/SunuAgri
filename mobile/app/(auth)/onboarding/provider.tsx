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

const SERVICE_TYPES = [
  "Labour et préparation du sol",
  "Semis et plantation",
  "Irrigation",
  "Traitement phytosanitaire",
  "Fertilisation",
  "Récolte",
  "Transport",
  "Stockage",
  "Conseil agricole",
  "Formation",
  "Location de matériel",
  "Maintenance d'équipements",
  "Analyse de sol",
  "Forage de puits",
  "Autre",
];

const INTERVENTION_ZONES = [
  "Dakar",
  "Thiès",
  "Diourbel",
  "Fatick",
  "Kaolack",
  "Kaffrine",
  "Louga",
  "Matam",
  "Saint-Louis",
  "Sédhiou",
  "Tambacounda",
  "Kédougou",
  "Kolda",
  "Ziguinchor",
];

export default function OnboardingProviderScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [displayName, setDisplayName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [region, setRegion] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  function toggleZone(zone: string) {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
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
    if (selectedServices.length === 0) {
      newErrors.services = "Sélectionnez au moins un service";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);

    const payload: any = {
      type: "PROVIDER",
      displayName: displayName.trim(),
      region,
      services: selectedServices,
    };

    // N'inclure les champs optionnels que s'ils existent
    if (selectedZones.length > 0) payload.interventionZones = selectedZones;

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

        <Text style={styles.heading}>🚜 Profil Prestataire</Text>
        <Text style={styles.sub}>
          Complétez votre profil pour offrir vos services agricoles
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Nom complet ou entreprise *"
            placeholder="Ibrahima Fall"
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
            <Text style={styles.label}>Services offerts *</Text>
            <Text style={styles.hint}>
              Sélectionnez au moins un service que vous proposez
            </Text>
            <View style={styles.chipsContainer}>
              {SERVICE_TYPES.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={[
                    styles.chip,
                    selectedServices.includes(service) && styles.chipSelected,
                  ]}
                  onPress={() => {
                    toggleService(service);
                    if (errors.services) {
                      setErrors((prev) => ({ ...prev, services: "" }));
                    }
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selectedServices.includes(service) }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedServices.includes(service) && styles.chipTextSelected,
                    ]}
                  >
                    {service}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.services && (
              <Text style={styles.error} accessibilityRole="alert">
                {errors.services}
              </Text>
            )}
          </View>

          <View>
            <Text style={styles.label}>Zones d'intervention</Text>
            <Text style={styles.hint}>
              Sélectionnez les régions où vous intervenez (optionnel)
            </Text>
            <View style={styles.chipsContainer}>
              {INTERVENTION_ZONES.map((zone) => (
                <TouchableOpacity
                  key={zone}
                  style={[
                    styles.chip,
                    selectedZones.includes(zone) && styles.chipSelected,
                  ]}
                  onPress={() => toggleZone(zone)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selectedZones.includes(zone) }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedZones.includes(zone) && styles.chipTextSelected,
                    ]}
                  >
                    {zone}
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.white,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.destructive,
    marginTop: 4,
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
