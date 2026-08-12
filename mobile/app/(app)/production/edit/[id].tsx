import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button, TextInput, Picker, Toast } from "../../../../src/components";
import { apiFetch } from "../../../../src/lib/api";
import { colors, spacing, fontSize, fontWeight, radius } from "../../../../src/lib/tokens";

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

interface ProductionDetail {
  id: string;
  name: string;
  category: string;
  variety?: string;
  offerType: string;
  region: string;
  commune?: string;
  quantityAvailable: number;
  quantityUnit: string;
  price: number;
  minOrderQty?: number;
  quality?: string;
  harvestDate?: string;
  availableUntil?: string;
  deliveryConditions?: string;
  description?: string;
}

export default function EditProductionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [initialLoading, setInitialLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "error" | "info" | "warning" }>({ visible: false, message: "", type: "success" });

  const communeOptions = region ? COMMUNES[region] ?? [] : [];

  useEffect(() => {
    async function loadProduction() {
      if (!id) return;

      const { data, error } = await apiFetch<ProductionDetail>(`/api/productions/${id}`);

      if (error || !data) {
        setNotFound(true);
        setInitialLoading(false);
        return;
      }

      // Pre-fill form
      setName(data.name);
      setCategory(data.category);
      setVariety(data.variety ?? "");
      setOfferType(data.offerType);
      setRegion(data.region);
      setCommune(data.commune ?? "");
      setQuantityAvailable(String(data.quantityAvailable));
      setQuantityUnit(data.quantityUnit);
      setPrice(String(data.price));
      setMinOrderQty(data.minOrderQty ? String(data.minOrderQty) : "");
      setQuality(data.quality ?? "");
      setHarvestDate(data.harvestDate ? data.harvestDate.split("T")[0] : "");
      setAvailableUntil(data.availableUntil ? data.availableUntil.split("T")[0] : "");
      setDeliveryConditions(data.deliveryConditions ?? "");
      setDescription(data.description ?? "");

      setInitialLoading(false);
    }

    loadProduction();
  }, [id]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Le nom est requis";
    if (!category) newErrors.category = "La catégorie est requise";
    if (!offerType) newErrors.offerType = "Le type d'offre est requis";
    if (!region) newErrors.region = "La région est requise";
    if (!quantityAvailable.trim() || isNaN(Number(quantityAvailable)) || Number(quantityAvailable) < 0) {
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
    if (harvestDate.trim()) payload.harvestDate = new Date(harvestDate).toISOString();
    if (availableUntil.trim()) payload.availableUntil = new Date(availableUntil).toISOString();
    if (deliveryConditions.trim()) payload.deliveryConditions = deliveryConditions.trim();
    if (description.trim()) payload.description = description.trim();

    const { data, error } = await apiFetch<{ id: string }>(
      `/api/productions/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );

    setLoading(false);

    if (error || !data) {
      setErrors({ submit: error ?? "Erreur lors de la mise à jour" });
      setToast({ visible: true, message: error ?? "Erreur lors de la mise à jour", type: "error" });
      return;
    }

    setToast({ visible: true, message: "Production mise à jour avec succès", type: "success" });

    setTimeout(() => {
      router.back();
    }, 1500);
  }

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Production introuvable</Text>
        <Button
          label="Retour"
          onPress={() => router.back()}
          variant="outline"
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
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

        <Text style={styles.heading}>Modifier la production</Text>
        <Text style={styles.sub}>
          Mettez à jour les informations de votre production
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.base,
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.destructive,
    textAlign: "center",
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
  errorBox: {
    backgroundColor: colors.destructiveLight,
    borderRadius: 10,
    padding: spacing.md,
  },
});
