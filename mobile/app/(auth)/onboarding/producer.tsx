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
import { useTheme } from "../../../src/contexts/ThemeContext";

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
    { label: "Grand Dakar", value: "Grand Dakar" },
    { label: "Pikine", value: "Pikine" },
    { label: "Guédiawaye", value: "Guédiawaye" },
    { label: "Rufisque", value: "Rufisque" },
  ],
  Thiès: [
    { label: "Thiès Nord", value: "Thiès Nord" },
    { label: "Thiès Est", value: "Thiès Est" },
    { label: "Thiès Ouest", value: "Thiès Ouest" },
    { label: "Mbour", value: "Mbour" },
    { label: "Tivaouane", value: "Tivaouane" },
  ],
  Diourbel: [
    { label: "Diourbel", value: "Diourbel" },
    { label: "Bambey", value: "Bambey" },
    { label: "Mbacké", value: "Mbacké" },
    { label: "Touba", value: "Touba" },
  ],
  Fatick: [
    { label: "Fatick", value: "Fatick" },
    { label: "Foundiougne", value: "Foundiougne" },
    { label: "Gossas", value: "Gossas" },
  ],
  Kaolack: [
    { label: "Kaolack", value: "Kaolack" },
    { label: "Guinguinéo", value: "Guinguinéo" },
    { label: "Nioro du Rip", value: "Nioro du Rip" },
  ],
  Kaffrine: [
    { label: "Kaffrine", value: "Kaffrine" },
    { label: "Birkelane", value: "Birkelane" },
    { label: "Koungheul", value: "Koungheul" },
    { label: "Malem Hodar", value: "Malem Hodar" },
  ],
  Louga: [
    { label: "Louga", value: "Louga" },
    { label: "Kébémer", value: "Kébémer" },
    { label: "Linguère", value: "Linguère" },
  ],
  Matam: [
    { label: "Matam", value: "Matam" },
    { label: "Kanel", value: "Kanel" },
    { label: "Ranérou", value: "Ranérou" },
  ],
  "Saint-Louis": [
    { label: "Saint-Louis", value: "Saint-Louis" },
    { label: "Dagana", value: "Dagana" },
    { label: "Podor", value: "Podor" },
  ],
  Sédhiou: [
    { label: "Sédhiou", value: "Sédhiou" },
    { label: "Bounkiling", value: "Bounkiling" },
    { label: "Goudomp", value: "Goudomp" },
  ],
  Tambacounda: [
    { label: "Tambacounda", value: "Tambacounda" },
    { label: "Bakel", value: "Bakel" },
    { label: "Goudiry", value: "Goudiry" },
    { label: "Koumpentoum", value: "Koumpentoum" },
  ],
  Kédougou: [
    { label: "Kédougou", value: "Kédougou" },
    { label: "Salemata", value: "Salemata" },
    { label: "Saraya", value: "Saraya" },
  ],
  Kolda: [
    { label: "Kolda", value: "Kolda" },
    { label: "Médina Yoro Foulah", value: "Médina Yoro Foulah" },
    { label: "Vélingara", value: "Vélingara" },
  ],
  Ziguinchor: [
    { label: "Ziguinchor", value: "Ziguinchor" },
    { label: "Bignona", value: "Bignona" },
    { label: "Oussouye", value: "Oussouye" },
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
  const { colors } = useTheme();
  const styles = getStyles(colors);

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

    const payload: any = {
      type: "PRODUCER",
      displayName: displayName.trim(),
      activityArea,
      region,
      commune,
    };

    // TODO: implémenter l'upload de photo plus tard
    // Pour l'instant, on ne l'envoie pas

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

          {/* Afficher Commune seulement après avoir choisi une région */}
          {region && (
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
            />
          )}

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
