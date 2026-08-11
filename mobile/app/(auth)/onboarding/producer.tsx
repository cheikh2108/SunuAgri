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
import { colors, spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";

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

const COMMUNES: Record<string, { label: string; value: string }[]> = {
  Dakar: [
    { label: "Dakar Plateau", value: "Dakar Plateau" },
    { label: "Médina", value: "Médina" },
    { label: "HLM", value: "HLM" },
  ],
  Thiès: [
    { label: "Thiès Nord", value: "Thiès Nord" },
    { label: "Thiès Est", value: "Thiès Est" },
    { label: "Thiès Ouest", value: "Thiès Ouest" },
  ],
};

const ACTIVITY_AREAS = [
  { label: "Cultures maraîchères", value: "Cultures maraîchères" },
  { label: "Céréales (mil, maïs, riz)", value: "Céréales (mil, maïs, riz)" },
  { label: "Arachide", value: "Arachide" },
  { label: "Fruits", value: "Fruits" },
  { label: "Élevage", value: "Élevage" },
  { label: "Aviculture", value: "Aviculture" },
  { label: "Pêche", value: "Pêche" },
  { label: "Apiculture", value: "Apiculture" },
  { label: "Autre", value: "Autre" },
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

export default function OnboardingProducerScreen() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [activityArea, setActivityArea] = useState("");
  const [region, setRegion] = useState("");
  const [commune, setCommune] = useState("");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const communeOptions = region ? COMMUNES[region] ?? [] : [];

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
    if (!activityArea) {
      newErrors.activityArea = "L'activité principale est requise";
    }
    if (!region) {
      newErrors.region = "La région est requise";
    }
    if (!commune) {
      newErrors.commune = "La commune est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("type", "PRODUCER");
    formData.append("displayName", displayName.trim());
    formData.append("activityArea", activityArea);
    formData.append("region", region);
    formData.append("commune", commune);
    if (selectedZones.length > 0) {
      formData.append("interventionZones", JSON.stringify(selectedZones));
    }

    if (photoUri) {
      const filename = photoUri.split("/").pop() ?? "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("photo", {
        uri: photoUri,
        name: filename,
        type,
      } as any);
    }

    const { data, error } = await apiFetch<{ profile: { id: string } }>(
      "/api/profiles",
      {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData as any,
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

        <Text style={styles.heading}>🌾 Profil Producteur</Text>
        <Text style={styles.sub}>
          Complétez votre profil pour vendre vos productions
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Nom complet *"
            placeholder="Awa Sène"
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
            label="Activité principale *"
            placeholder="Sélectionner une activité"
            value={activityArea}
            options={ACTIVITY_AREAS}
            onValueChange={(value) => {
              setActivityArea(value);
              if (errors.activityArea) {
                setErrors((prev) => ({ ...prev, activityArea: "" }));
              }
            }}
            error={errors.activityArea}
          />

          <Picker
            label="Région *"
            placeholder="Sélectionner une région"
            value={region}
            options={REGIONS}
            onValueChange={(value) => {
              setRegion(value);
              setCommune("");
              if (errors.region) {
                setErrors((prev) => ({ ...prev, region: "" }));
              }
            }}
            error={errors.region}
          />

          <Picker
            label="Commune *"
            placeholder="Sélectionner une commune"
            value={commune}
            options={communeOptions}
            onValueChange={(value) => {
              setCommune(value);
              if (errors.commune) {
                setErrors((prev) => ({ ...prev, commune: "" }));
              }
            }}
            error={errors.commune}
            disabled={communeOptions.length === 0}
          />

          <View>
            <Text style={styles.label}>Zones d'intervention</Text>
            <Text style={styles.hint}>
              Sélectionnez les régions où vous pouvez livrer (optionnel)
            </Text>
            <View style={styles.zonesContainer}>
              {INTERVENTION_ZONES.map((zone) => (
                <TouchableOpacity
                  key={zone}
                  style={[
                    styles.zoneChip,
                    selectedZones.includes(zone) && styles.zoneChipSelected,
                  ]}
                  onPress={() => toggleZone(zone)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selectedZones.includes(zone) }}
                >
                  <Text
                    style={[
                      styles.zoneChipText,
                      selectedZones.includes(zone) && styles.zoneChipTextSelected,
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

const styles = StyleSheet.create({
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
  zonesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  zoneChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  zoneChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  zoneChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  zoneChipTextSelected: {
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
