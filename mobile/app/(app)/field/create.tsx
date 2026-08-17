import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../src/components/Button";
import { TextInput } from "../../../src/components/TextInput";
import { Picker } from "../../../src/components/Picker";
import { Toast } from "../../../src/components/Toast";
import { ImagePickerMultiple } from "../../../src/components/ImagePickerMultiple";
import { apiFetch } from "../../../src/lib/api";
import { uploadImages } from "../../../src/lib/upload";
import { spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { REGIONS, DEPARTMENTS, COMMUNES } from "../../../src/lib/geographic-data";

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

export default function CreateFieldScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const departmentOptions = region ? DEPARTMENTS[region] ?? [] : [];
  const communeOptions = department ? COMMUNES[department] ?? [] : [];

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

    setLoading(true);

    try {
      // Step 1: Upload photos if any
      let mediaUrls: { url: string; mediaId: string }[] | undefined;
      if (photos.length > 0) {
        const { data: uploadedMedia, error: uploadError } = await uploadImages(
          photos,
          "fields",
          (progress) => {
            setUploadProgress(progress.percentage);
          }
        );

        if (uploadError || !uploadedMedia) {
          setErrors({ submit: uploadError ?? "Erreur lors du téléchargement des photos" });
          setToast({ message: "Erreur lors du téléchargement des photos", type: "error" });
          setLoading(false);
          setUploadProgress(null);
          return;
        }

        mediaUrls = uploadedMedia.map((media) => ({
          url: media.url,
          mediaId: media.mediaId,
        }));
      }

      // Reset upload progress
      setUploadProgress(null);

      // Step 2: Create field with media URLs
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
        mediaUrls,
      };

      const { data, error } = await apiFetch<{ id: string; title: string }>(
        "/api/fields",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setLoading(false);

      if (error || !data) {
        setErrors({ submit: error ?? "Erreur lors de la création de l'annonce" });
        setToast({ message: error ?? "Erreur lors de la création", type: "error" });
        return;
      }

      setToast({ message: "Annonce créée avec succès", type: "success" });
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      setLoading(false);
      setUploadProgress(null);
      setErrors({ submit: "Erreur inattendue" });
      setToast({ message: "Erreur inattendue", type: "error" });
    }
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

        <Text style={styles.heading}>📋 Publier un terrain</Text>
        <Text style={styles.sub}>
          Créez votre annonce pour mettre votre terrain à disposition
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
            <Text style={styles.sectionTitle}>📸 Photos du terrain</Text>
            <Text style={styles.sectionHint}>
              Ajoutez jusqu'à 5 photos de votre terrain
            </Text>
            <ImagePickerMultiple
              value={photos}
              onValueChange={setPhotos}
              maxImages={5}
              uploadProgress={uploadProgress}
            />
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
            label="Créer l'annonce"
            onPress={handleSubmit}
            loading={loading}
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
