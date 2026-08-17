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
import { Button } from "../../../src/components/Button";
import { TextInput } from "../../../src/components/TextInput";
import { Picker } from "../../../src/components/Picker";
import { Toast } from "../../../src/components/Toast";
import { ImagePickerMultiple } from "../../../src/components/ImagePickerMultiple";
import { apiFetch } from "../../../src/lib/api";
import { uploadImages } from "../../../src/lib/upload";
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
  ],
  Thiès: [
    { label: "Thiès Nord", value: "Thiès Nord" },
    { label: "Thiès Est", value: "Thiès Est" },
    { label: "Thiès Ouest", value: "Thiès Ouest" },
  ],
};

const CATEGORIES = [
  { label: "Légumes", value: "Légumes" },
  { label: "Fruits", value: "Fruits" },
  { label: "Céréales", value: "Céréales" },
  { label: "Tubercules", value: "Tubercules" },
  { label: "Légumineuses", value: "Légumineuses" },
  { label: "Oléagineux", value: "Oléagineux" },
  { label: "Épices et condiments", value: "Épices et condiments" },
  { label: "Produits transformés", value: "Produits transformés" },
  { label: "Élevage", value: "Élevage" },
  { label: "Pêche", value: "Pêche" },
  { label: "Autre", value: "Autre" },
];

const OFFER_TYPES = [
  { label: "Disponible maintenant", value: "AVAILABLE_NOW" },
  { label: "Récolte en cours", value: "HARVEST_IN_PROGRESS" },
  { label: "Bientôt disponible", value: "AVAILABLE_SOON" },
  { label: "Précommande", value: "PREORDER" },
  { label: "Vente en gros", value: "WHOLESALE" },
  { label: "Vente au détail", value: "RETAIL" },
  { label: "Contrat d'approvisionnement", value: "SUPPLY_CONTRACT" },
  { label: "Produit transformé", value: "PROCESSED" },
  { label: "Bio / certifié", value: "ORGANIC" },
];

const QUANTITY_UNITS = [
  { label: "kg", value: "kg" },
  { label: "tonnes", value: "tonnes" },
  { label: "sacs", value: "sacs" },
  { label: "caisses", value: "caisses" },
  { label: "unités", value: "unités" },
  { label: "litres", value: "litres" },
];

const QUALITY_OPTIONS = [
  { label: "Standard", value: "Standard" },
  { label: "Premium", value: "Premium" },
  { label: "Bio", value: "Bio" },
];

export default function CreateProductionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [variety, setVariety] = useState("");
  const [offerType, setOfferType] = useState("");
  const [region, setRegion] = useState("");
  const [commune, setCommune] = useState("");
  const [quantityAvailable, setQuantityAvailable] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("");
  const [price, setPrice] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("");
  const [quality, setQuality] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [deliveryConditions, setDeliveryConditions] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "error" }>({
    visible: false,
    message: "",
    type: "success",
  });

  const communeOptions = region ? COMMUNES[region] ?? [] : [];

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Le nom est requis";
    if (!category) newErrors.category = "La catégorie est requise";
    if (!offerType) newErrors.offerType = "Le type d'offre est requis";
    if (!region) newErrors.region = "La région est requise";
    if (!quantityAvailable.trim() || isNaN(Number(quantityAvailable)) || Number(quantityAvailable) <= 0) {
      newErrors.quantityAvailable = "Quantité invalide";
    }
    if (!quantityUnit) newErrors.quantityUnit = "L'unité est requise";
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = "Prix invalide";
    }
    if (minOrderQty && (isNaN(Number(minOrderQty)) || Number(minOrderQty) <= 0)) {
      newErrors.minOrderQty = "Quantité minimale invalide";
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
          "productions",
          (progress) => {
            setUploadProgress(progress.percentage);
          }
        );

        if (uploadError || !uploadedMedia) {
          setErrors({ submit: uploadError ?? "Erreur lors du téléchargement des photos" });
          setToast({ visible: true, message: "Erreur lors du téléchargement des photos", type: "error" });
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

      // Step 2: Create production with media URLs
      const payload: any = {
        name: name.trim(),
        category,
        offerType,
        region,
        quantityAvailable: Number(quantityAvailable),
        quantityUnit,
        price: Number(price),
      };

      if (variety.trim()) payload.variety = variety.trim();
      if (commune) payload.commune = commune;
      if (minOrderQty.trim()) payload.minOrderQty = Number(minOrderQty);
      if (quality) payload.quality = quality;
      if (harvestDate.trim()) payload.harvestDate = harvestDate.trim();
      if (availableUntil.trim()) payload.availableUntil = availableUntil.trim();
      if (deliveryConditions.trim()) payload.deliveryConditions = deliveryConditions.trim();
      if (description.trim()) payload.description = description.trim();
      if (mediaUrls) payload.mediaUrls = mediaUrls;

      const { data, error } = await apiFetch<{ id: string; name: string }>(
        "/api/productions",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setLoading(false);

      if (error || !data) {
        setErrors({ submit: error ?? "Erreur lors de la création" });
        setToast({ visible: true, message: error ?? "Erreur lors de la création", type: "error" });
        return;
      }

      setToast({ visible: true, message: "Production publiée avec succès", type: "success" });

      setTimeout(() => {
        router.replace("/(app)/(tabs)/market");
      }, 1500);
    } catch (err) {
      setLoading(false);
      setUploadProgress(null);
      setErrors({ submit: "Erreur inattendue" });
      setToast({ visible: true, message: "Erreur inattendue", type: "error" });
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Button
          label="← Retour"
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          style={{ alignSelf: "flex-start", marginBottom: spacing.md }}
        />

        <Text style={styles.heading}>Publier une production</Text>
        <Text style={styles.sub}>
          Remplissez les informations de votre production
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Nom de la production *"
            placeholder="Tomates Cerise"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            error={errors.name}
            returnKeyType="next"
          />

          <Picker
            label="Catégorie *"
            placeholder="Sélectionner une catégorie"
            value={category}
            options={CATEGORIES}
            onValueChange={(value) => {
              setCategory(value);
              if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
            }}
            error={errors.category}
          />

          <TextInput
            label="Variété"
            placeholder="Tomate Roma"
            value={variety}
            onChangeText={setVariety}
            returnKeyType="next"
          />

          <Picker
            label="Type d'offre *"
            placeholder="Sélectionner un type"
            value={offerType}
            options={OFFER_TYPES}
            onValueChange={(value) => {
              setOfferType(value);
              if (errors.offerType) setErrors((prev) => ({ ...prev, offerType: "" }));
            }}
            error={errors.offerType}
          />

          <Picker
            label="Région *"
            placeholder="Sélectionner une région"
            value={region}
            options={REGIONS}
            onValueChange={(value) => {
              setRegion(value);
              setCommune("");
              if (errors.region) setErrors((prev) => ({ ...prev, region: "" }));
            }}
            error={errors.region}
          />

          <Picker
            label="Commune"
            placeholder="Sélectionner une commune"
            value={commune}
            options={communeOptions}
            onValueChange={setCommune}
            disabled={communeOptions.length === 0}
          />

          <View style={styles.row}>
            <TextInput
              label="Quantité disponible *"
              placeholder="100"
              value={quantityAvailable}
              onChangeText={(text) => {
                setQuantityAvailable(text);
                if (errors.quantityAvailable) {
                  setErrors((prev) => ({ ...prev, quantityAvailable: "" }));
                }
              }}
              error={errors.quantityAvailable}
              keyboardType="numeric"
              returnKeyType="next"
              style={{ flex: 1 }}
            />

            <Picker
              label="Unité *"
              placeholder="Unité"
              value={quantityUnit}
              options={QUANTITY_UNITS}
              onValueChange={(value) => {
                setQuantityUnit(value);
                if (errors.quantityUnit) setErrors((prev) => ({ ...prev, quantityUnit: "" }));
              }}
              error={errors.quantityUnit}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              label="Prix unitaire (FCFA) *"
              placeholder="5000"
              value={price}
              onChangeText={(text) => {
                setPrice(text);
                if (errors.price) setErrors((prev) => ({ ...prev, price: "" }));
              }}
              error={errors.price}
              keyboardType="numeric"
              returnKeyType="next"
              style={{ flex: 1 }}
            />

            <TextInput
              label="Commande min."
              placeholder="10"
              value={minOrderQty}
              onChangeText={(text) => {
                setMinOrderQty(text);
                if (errors.minOrderQty) setErrors((prev) => ({ ...prev, minOrderQty: "" }));
              }}
              error={errors.minOrderQty}
              keyboardType="numeric"
              returnKeyType="next"
              style={{ flex: 1 }}
            />
          </View>

          <Picker
            label="Qualité"
            placeholder="Sélectionner une qualité"
            value={quality}
            options={QUALITY_OPTIONS}
            onValueChange={setQuality}
          />

          <TextInput
            label="Date de récolte"
            placeholder="2026-08-15"
            value={harvestDate}
            onChangeText={setHarvestDate}
            hint="Format: AAAA-MM-JJ"
            returnKeyType="next"
          />

          <TextInput
            label="Disponible jusqu'au"
            placeholder="2026-09-15"
            value={availableUntil}
            onChangeText={setAvailableUntil}
            hint="Format: AAAA-MM-JJ"
            returnKeyType="next"
          />

          <TextInput
            label="Conditions de livraison"
            placeholder="Livraison possible dans un rayon de 50km"
            value={deliveryConditions}
            onChangeText={setDeliveryConditions}
            multiline
            numberOfLines={2}
            returnKeyType="next"
          />

          <TextInput
            label="Description"
            placeholder="Décrivez votre production, son état, etc."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            returnKeyType="default"
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Photos de la production</Text>
            <Text style={styles.sectionHint}>
              Ajoutez jusqu'à 5 photos de votre production
            </Text>
            <ImagePickerMultiple
              value={photos}
              onValueChange={setPhotos}
              maxImages={5}
              uploadProgress={uploadProgress}
            />
          </View>

          {errors.submit && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} accessibilityRole="alert">
                {errors.submit}
              </Text>
            </View>
          )}

          <Button
            label="Publier la production"
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
  row: {
    flexDirection: "row",
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
