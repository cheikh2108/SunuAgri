import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button, TextInput, Picker, Toast } from "../../../../src/components";
import { apiFetch } from "../../../../src/lib/api";
import { spacing, fontSize, fontWeight, radius } from "../../../../src/lib/tokens";
import { useTheme } from "../../../../src/contexts/ThemeContext";
import { REGIONS, DEPARTMENTS, COMMUNES } from "../../../../src/lib/geographic-data";

const OPERATION_TYPES = [
  { label: "Location saisonnière", value: "SEASONAL_RENT" },
  { label: "Location annuelle", value: "ANNUAL_RENT" },
  { label: "Location long terme", value: "LONG_TERM_RENT" },
  { label: "Vente", value: "SALE" },
  { label: "Métayage", value: "SHARECROPPING" },
  { label: "Part de récolte", value: "HARVEST_SHARE" },
  { label: "Partenariat d'exploitation", value: "EXPLOITATION_PARTNERSHIP" },
  { label: "Recherche d'investisseur", value: "INVESTOR_SEARCH" },
  { label: "Mise à disposition conventionnelle", value: "CONVENTIONAL_PROVISION" },
];

const DOCUMENT_TYPES = [
  { label: "Titre de propriété", value: "TITLE_DEED" },
  { label: "Bail", value: "LEASE" },
  { label: "Délibération", value: "DELIBERATION" },
  { label: "Certificat d'attribution", value: "ATTRIBUTION_CERTIFICATE" },
  { label: "Acte administratif", value: "ADMINISTRATIVE_ACT" },
  { label: "Document coutumier", value: "CUSTOMARY_DOCUMENT" },
  { label: "Contrat", value: "CONTRACT" },
  { label: "Aucun document formel", value: "NO_FORMAL_DOCUMENT" },
];

const SOIL_TYPES = [
  { label: "Argileux", value: "Argileux" },
  { label: "Sableux", value: "Sableux" },
  { label: "Limoneux", value: "Limoneux" },
  { label: "Latéritique", value: "Latéritique" },
  { label: "Mixte", value: "Mixte" },
];

interface Field {
  id: string;
  title: string;
  description?: string;
  operationType: string;
  region: string;
  department?: string;
  commune: string;
  locality?: string;
  areaSqm: number;
  price?: number;
  isPriceNegotiable: boolean;
  soilType?: string;
  waterAvailability: boolean;
  hasRoadAccess: boolean;
  documentTypes?: string[];
}

export default function EditFieldScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [operationType, setOperationType] = useState("");
  const [region, setRegion] = useState("");
  const [department, setDepartment] = useState("");
  const [commune, setCommune] = useState("");
  const [locality, setLocality] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [soilType, setSoilType] = useState("");
  const [waterAccess, setWaterAccess] = useState(false);
  const [roadAccess, setRoadAccess] = useState(false);
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const departmentOptions = region ? DEPARTMENTS[region] ?? [] : [];
  const communeOptions = department ? COMMUNES[department] ?? [] : [];

  useEffect(() => {
    async function fetchField() {
      const { data, error } = await apiFetch<Field>(`/api/fields/${id}`);

      if (error || !data) {
        setToast({ message: error ?? "Erreur lors du chargement", type: "error" });
        setLoading(false);
        return;
      }

      setTitle(data.title);
      setDescription(data.description ?? "");
      setOperationType(data.operationType);
      setRegion(data.region);
      setDepartment(data.department ?? "");
      setCommune(data.commune);
      setLocality(data.locality ?? "");
      setAreaSqm(data.areaSqm.toString());
      setPrice(data.price?.toString() ?? "");
      setNegotiable(data.isPriceNegotiable);
      setSoilType(data.soilType ?? "");
      setWaterAccess(data.waterAvailability);
      setRoadAccess(data.hasRoadAccess);
      setSelectedDocumentTypes(data.documentTypes ?? []);
      setLoading(false);
    }

    fetchField();
  }, [id]);

  function toggleDocumentType(value: string) {
    setSelectedDocumentTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 5) {
      newErrors.title = "Le titre doit contenir au moins 5 caractères";
    }
    if (!description.trim() || description.trim().length < 20) {
      newErrors.description = "La description doit contenir au moins 20 caractères";
    }
    if (!operationType) {
      newErrors.operationType = "Le type d'opération est requis";
    }
    if (!region) {
      newErrors.region = "La région est requise";
    }
    if (!commune) {
      newErrors.commune = "La commune est requise";
    }
    if (!areaSqm || Number(areaSqm) <= 0) {
      newErrors.areaSqm = "La superficie doit être supérieure à 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      operationType,
      region,
      department: department || undefined,
      commune,
      locality: locality.trim() || undefined,
      areaSqm: Number(areaSqm),
      price: price ? Number(price) : undefined,
      isPriceNegotiable: negotiable,
      soilType: soilType || undefined,
      waterAvailability: waterAccess,
      hasRoadAccess: roadAccess,
    };

    const { data, error } = await apiFetch<{ id: string; title: string }>(
      `/api/fields/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );

    setSaving(false);

    if (error || !data) {
      setErrors({ submit: error ?? "Erreur lors de la modification" });
      setToast({ message: error ?? "Erreur lors de la modification", type: "error" });
      return;
    }

    setToast({ message: "Annonce modifiée avec succès", type: "success" });
    setTimeout(() => {
      router.back();
    }, 1500);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
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

        <Text style={styles.heading}>✏️ Modifier l'annonce</Text>
        <Text style={styles.sub}>
          Mettez à jour les informations de votre terrain
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Titre de l'annonce *"
            placeholder="Terrain agricole de 2 hectares..."
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) {
                setErrors((prev) => ({ ...prev, title: "" }));
              }
            }}
            error={errors.title}
            returnKeyType="next"
          />

          <TextInput
            label="Description *"
            placeholder="Décrivez votre terrain, ses avantages, son environnement..."
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: "" }));
              }
            }}
            error={errors.description}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: "top", paddingTop: spacing.md }}
          />

          <Picker
            label="Type d'opération *"
            placeholder="Sélectionner le type"
            value={operationType}
            options={OPERATION_TYPES}
            onValueChange={(value) => {
              setOperationType(value);
              if (errors.operationType) {
                setErrors((prev) => ({ ...prev, operationType: "" }));
              }
            }}
            error={errors.operationType}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Localisation</Text>

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
              placeholder="Village, quartier..."
              value={locality}
              onChangeText={setLocality}
              returnKeyType="next"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📐 Superficie et prix</Text>

            <TextInput
              label="Superficie (m²) *"
              placeholder="10000"
              value={areaSqm}
              onChangeText={(text) => {
                setAreaSqm(text);
                if (errors.areaSqm) {
                  setErrors((prev) => ({ ...prev, areaSqm: "" }));
                }
              }}
              error={errors.areaSqm}
              keyboardType="numeric"
              returnKeyType="next"
            />

            <TextInput
              label="Prix (XOF)"
              placeholder="500000"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              returnKeyType="next"
            />

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchText}>Prix négociable</Text>
              </View>
              <Switch
                value={negotiable}
                onValueChange={setNegotiable}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={negotiable ? colors.primary : colors.surface}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌾 Caractéristiques</Text>

            <Picker
              label="Type de sol"
              placeholder="Sélectionner le type de sol"
              value={soilType}
              options={SOIL_TYPES}
              onValueChange={setSoilType}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchText}>Accès à l'eau</Text>
              </View>
              <Switch
                value={waterAccess}
                onValueChange={setWaterAccess}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={waterAccess ? colors.primary : colors.surface}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchText}>Accès routier</Text>
              </View>
              <Switch
                value={roadAccess}
                onValueChange={setRoadAccess}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={roadAccess ? colors.primary : colors.surface}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 Documents disponibles</Text>
            <Text style={styles.sectionHint}>
              Sélectionnez les documents que vous possédez
            </Text>

            {DOCUMENT_TYPES.map((doc) => (
              <TouchableOpacity
                key={doc.value}
                style={styles.checkboxRow}
                onPress={() => toggleDocumentType(doc.value)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedDocumentTypes.includes(doc.value) && styles.checkboxChecked,
                  ]}
                >
                  {selectedDocumentTypes.includes(doc.value) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{doc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {errors.submit && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} accessibilityRole="alert">
                {errors.submit}
              </Text>
            </View>
          )}

          <Button
            label="Enregistrer les modifications"
            onPress={handleSubmit}
            loading={saving}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </ScrollView>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={!!toast}
          onHide={() => setToast(null)}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
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
  section: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  sectionHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  switchLabel: {
    flex: 1,
  },
  switchText: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
  },
  errorBox: {
    backgroundColor: colors.destructiveLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.destructive,
  },
});
