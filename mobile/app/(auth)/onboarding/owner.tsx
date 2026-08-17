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
import { spacing, fontSize, fontWeight } from "../../../src/lib/tokens";
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
  Diourbel: [
    { label: "Diourbel", value: "Diourbel" },
    { label: "Bambey", value: "Bambey" },
    { label: "Mbacké", value: "Mbacké" },
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

const COMMUNES: Record<string, { label: string; value: string }[]> = {
  Dakar: [
    { label: "Dakar Plateau", value: "Dakar Plateau" },
    { label: "Médina", value: "Médina" },
    { label: "HLM", value: "HLM" },
    { label: "Grand Dakar", value: "Grand Dakar" },
    { label: "Parcelles Assainies", value: "Parcelles Assainies" },
  ],
  Pikine: [
    { label: "Pikine", value: "Pikine" },
    { label: "Thiaroye", value: "Thiaroye" },
    { label: "Diamaguène", value: "Diamaguène" },
  ],
  Guédiawaye: [
    { label: "Guédiawaye", value: "Guédiawaye" },
    { label: "Golf Sud", value: "Golf Sud" },
    { label: "Médina Gounass", value: "Médina Gounass" },
  ],
  Rufisque: [
    { label: "Rufisque", value: "Rufisque" },
    { label: "Bargny", value: "Bargny" },
    { label: "Diamniadio", value: "Diamniadio" },
  ],
  Thiès: [
    { label: "Thiès Nord", value: "Thiès Nord" },
    { label: "Thiès Est", value: "Thiès Est" },
    { label: "Thiès Ouest", value: "Thiès Ouest" },
  ],
  Mbour: [
    { label: "Mbour", value: "Mbour" },
    { label: "Saly", value: "Saly" },
    { label: "Ngaparou", value: "Ngaparou" },
  ],
  Tivaouane: [
    { label: "Tivaouane", value: "Tivaouane" },
    { label: "Mékhé", value: "Mékhé" },
  ],
  // Diourbel - Départements
  Diourbel: [
    { label: "Diourbel", value: "Diourbel" },
    { label: "Ndoulo", value: "Ndoulo" },
  ],
  Bambey: [
    { label: "Bambey", value: "Bambey" },
    { label: "Dinguiraye", value: "Dinguiraye" },
  ],
  Mbacké: [
    { label: "Mbacké", value: "Mbacké" },
    { label: "Touba", value: "Touba" },
    { label: "Darou Mousty", value: "Darou Mousty" },
  ],
  // Fatick - Départements
  Fatick: [
    { label: "Fatick", value: "Fatick" },
    { label: "Dioffior", value: "Dioffior" },
  ],
  Foundiougne: [
    { label: "Foundiougne", value: "Foundiougne" },
    { label: "Toubacouta", value: "Toubacouta" },
  ],
  Gossas: [
    { label: "Gossas", value: "Gossas" },
    { label: "Colobane", value: "Colobane" },
  ],
  // Kaolack - Départements
  Kaolack: [
    { label: "Kaolack", value: "Kaolack" },
    { label: "Ndoffane", value: "Ndoffane" },
  ],
  Guinguinéo: [
    { label: "Guinguinéo", value: "Guinguinéo" },
  ],
  "Nioro du Rip": [
    { label: "Nioro du Rip", value: "Nioro du Rip" },
    { label: "Keur Samba Kane", value: "Keur Samba Kane" },
  ],
  // Kaffrine - Départements
  Kaffrine: [
    { label: "Kaffrine", value: "Kaffrine" },
  ],
  Birkelane: [
    { label: "Birkelane", value: "Birkelane" },
  ],
  Koungheul: [
    { label: "Koungheul", value: "Koungheul" },
    { label: "Lour Escale", value: "Lour Escale" },
  ],
  "Malem Hodar": [
    { label: "Malem Hodar", value: "Malem Hodar" },
  ],
  // Louga - Départements
  Louga: [
    { label: "Louga", value: "Louga" },
    { label: "Coki", value: "Coki" },
  ],
  Kébémer: [
    { label: "Kébémer", value: "Kébémer" },
    { label: "Ndande", value: "Ndande" },
  ],
  Linguère: [
    { label: "Linguère", value: "Linguère" },
    { label: "Dahra", value: "Dahra" },
  ],
  // Matam - Départements
  Matam: [
    { label: "Matam", value: "Matam" },
    { label: "Ourossogui", value: "Ourossogui" },
  ],
  Kanel: [
    { label: "Kanel", value: "Kanel" },
    { label: "Semmé", value: "Semmé" },
  ],
  Ranérou: [
    { label: "Ranérou", value: "Ranérou" },
  ],
  // Saint-Louis - Départements
  "Saint-Louis": [
    { label: "Saint-Louis", value: "Saint-Louis" },
    { label: "Rao", value: "Rao" },
  ],
  Dagana: [
    { label: "Dagana", value: "Dagana" },
    { label: "Richard Toll", value: "Richard Toll" },
  ],
  Podor: [
    { label: "Podor", value: "Podor" },
    { label: "Ndioum", value: "Ndioum" },
  ],
  // Sédhiou - Départements
  Sédhiou: [
    { label: "Sédhiou", value: "Sédhiou" },
  ],
  Bounkiling: [
    { label: "Bounkiling", value: "Bounkiling" },
  ],
  Goudomp: [
    { label: "Goudomp", value: "Goudomp" },
  ],
  // Tambacounda - Départements
  Tambacounda: [
    { label: "Tambacounda", value: "Tambacounda" },
    { label: "Missirah", value: "Missirah" },
  ],
  Bakel: [
    { label: "Bakel", value: "Bakel" },
  ],
  Goudiry: [
    { label: "Goudiry", value: "Goudiry" },
  ],
  Koumpentoum: [
    { label: "Koumpentoum", value: "Koumpentoum" },
  ],
  // Kédougou - Départements
  Kédougou: [
    { label: "Kédougou", value: "Kédougou" },
  ],
  Salemata: [
    { label: "Salemata", value: "Salemata" },
  ],
  Saraya: [
    { label: "Saraya", value: "Saraya" },
  ],
  // Kolda - Départements
  Kolda: [
    { label: "Kolda", value: "Kolda" },
  ],
  "Médina Yoro Foulah": [
    { label: "Médina Yoro Foulah", value: "Médina Yoro Foulah" },
  ],
  Vélingara: [
    { label: "Vélingara", value: "Vélingara" },
  ],
  // Ziguinchor - Départements
  Ziguinchor: [
    { label: "Ziguinchor", value: "Ziguinchor" },
  ],
  Bignona: [
    { label: "Bignona", value: "Bignona" },
    { label: "Diouloulou", value: "Diouloulou" },
  ],
  Oussouye: [
    { label: "Oussouye", value: "Oussouye" },
  ],
};

export default function OnboardingOwnerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [displayName, setDisplayName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [region, setRegion] = useState("");
  const [department, setDepartment] = useState("");
  const [commune, setCommune] = useState("");
  const [locality, setLocality] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const departmentOptions = region ? DEPARTMENTS[region] ?? [] : [];
  const communeOptions = department
    ? COMMUNES[department] ?? []
    : region
      ? COMMUNES[region] ?? []
      : [];

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = "Le nom est requis";
    }
    if (!region) {
      newErrors.region = "La région est requise";
    }
    // Si des départements existent pour cette région, le département est obligatoire
    if (departmentOptions.length > 0 && !department) {
      newErrors.department = "Le département est requis";
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
      type: "OWNER",
      displayName: displayName.trim(),
      region,
      commune,
    };

    // N'inclure les champs optionnels que s'ils existent
    if (department) payload.department = department;
    if (locality.trim()) payload.locality = locality.trim();

    // TODO: implémenter l'upload de photo plus tard

    const { data, error} = await apiFetch<{ profile: { id: string } }>(
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
              label="Département *"
              placeholder="Sélectionner un département"
              value={department}
              options={departmentOptions}
              onValueChange={(value) => {
                setDepartment(value);
                setCommune("");
                if (errors.department) {
                  setErrors((prev) => ({ ...prev, department: "" }));
                }
              }}
              error={errors.department}
            />
          )}

          {/* Afficher Commune seulement si région choisie ET (département choisi OU pas de départements) */}
          {region && (departmentOptions.length === 0 || department) && (
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

          {/* Afficher Localité seulement après avoir choisi une commune */}
          {commune && (
            <TextInput
              label="Localité"
              placeholder="Mbour 2"
              value={locality}
              onChangeText={setLocality}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          )}

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
