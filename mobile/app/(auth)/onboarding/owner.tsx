import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "../../../src/components/Button";
import { TextInput } from "../../../src/components/TextInput";
import { Picker } from "../../../src/components/Picker";
import { ImagePickerField } from "../../../src/components/ImagePickerField";
import { apiFetch } from "../../../src/lib/api";
import { colors, spacing, fontSize, fontWeight } from "../../../src/lib/tokens";

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

const DEPARTMENTS: Record<string, { label: string; value: string }[]> = {
  Dakar: [
    { label: "Dakar", value: "Dakar" },
    { label: "Pikine", value: "Pikine" },
    { label: "Guédiawaye", value: "Guédiawaye" },
    { label: "Rufisque", value: "Rufisque" },
  ],
  Thiès: [
    { label: "Thiès", value: "Thiès" },
    { label: "Mbour", value: "Mbour" },
    { label: "Tivaouane", value: "Tivaouane" },
  ],
};

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
  Mbour: [
    { label: "Mbour", value: "Mbour" },
    { label: "Saly", value: "Saly" },
  ],
};

export default function OnboardingOwnerScreen() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [region, setRegion] = useState("");
  const [department, setDepartment] = useState("");
  const [commune, setCommune] = useState("");
  const [locality, setLocality] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const departmentOptions = region ? DEPARTMENTS[region] ?? [] : [];
  const communeOptions = department ? COMMUNES[department] ?? [] : [];

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = "Le nom est requis";
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
    formData.append("type", "OWNER");
    formData.append("displayName", displayName.trim());
    formData.append("region", region);
    if (department) formData.append("department", department);
    formData.append("commune", commune);
    if (locality.trim()) formData.append("locality", locality.trim());

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

        <Text style={styles.heading}>📍 Profil Propriétaire</Text>
        <Text style={styles.sub}>
          Complétez votre profil pour publier vos terres
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Nom complet ou raison sociale *"
            placeholder="Moussa Diop"
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
              setDepartment("");
              setCommune("");
              if (errors.region) {
                setErrors((prev) => ({ ...prev, region: "" }));
              }
            }}
            error={errors.region}
          />

          {departmentOptions.length > 0 && (
            <Picker
              label="Département"
              placeholder="Sélectionner un département"
              value={department}
              options={departmentOptions}
              onValueChange={(value) => {
                setDepartment(value);
                setCommune("");
              }}
            />
          )}

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
            disabled={!department && communeOptions.length === 0}
          />

          <TextInput
            label="Localité"
            placeholder="Mbour 2"
            value={locality}
            onChangeText={setLocality}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

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
