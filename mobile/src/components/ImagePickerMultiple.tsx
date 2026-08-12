import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, spacing, radius, fontSize, fontWeight } from "../lib/tokens";

interface Props {
  label?: string;
  value: string[];
  onValueChange: (uris: string[]) => void;
  error?: string;
  maxImages?: number;
  uploadProgress?: number | null;
}

export function ImagePickerMultiple({
  label,
  value,
  onValueChange,
  error,
  maxImages = 5,
  uploadProgress,
}: Props) {
  async function pickImages() {
    if (value.length >= maxImages) {
      Alert.alert("Limite atteinte", `Vous ne pouvez ajouter que ${maxImages} photos maximum.`);
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission requise",
        "Veuillez autoriser l'accès à vos photos pour ajouter des images."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.7,
      selectionLimit: maxImages - value.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((asset) => asset.uri);
      onValueChange([...value, ...newUris]);
    }
  }

  async function takePhoto() {
    if (value.length >= maxImages) {
      Alert.alert("Limite atteinte", `Vous ne pouvez ajouter que ${maxImages} photos maximum.`);
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission requise",
        "Veuillez autoriser l'accès à l'appareil photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      onValueChange([...value, result.assets[0].uri]);
    }
  }

  function showOptions() {
    Alert.alert("Ajouter des photos", "Choisissez une source", [
      { text: "Prendre une photo", onPress: takePhoto },
      { text: "Choisir depuis la galerie", onPress: pickImages },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  function removeImage(index: number) {
    const newValue = [...value];
    newValue.splice(index, 1);
    onValueChange(newValue);
  }

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {value.map((uri, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
              accessibilityRole="button"
              accessibilityLabel="Supprimer la photo"
            >
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {value.length < maxImages && (
          <TouchableOpacity
            style={[styles.placeholder, error && styles.placeholderError]}
            onPress={showOptions}
            accessibilityRole="button"
            accessibilityLabel="Ajouter des photos"
            disabled={uploadProgress !== null && uploadProgress !== undefined}
          >
            {uploadProgress !== null && uploadProgress !== undefined ? (
              <>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.uploadText}>{Math.round(uploadProgress)}%</Text>
              </>
            ) : (
              <>
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text style={styles.placeholderText}>
                  Ajouter{"\n"}({value.length}/{maxImages})
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}

      {value.length > 0 && (
        <Text style={styles.hint}>
          {value.length} photo{value.length > 1 ? "s" : ""} sélectionnée{value.length > 1 ? "s" : ""}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  scrollView: {
    flexGrow: 0,
  },
  imageContainer: {
    position: "relative",
    marginRight: spacing.md,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.destructive,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  removeIcon: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  placeholder: {
    width: 100,
    height: 100,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
  },
  placeholderError: {
    borderColor: colors.destructive,
  },
  placeholderIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  placeholderText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  uploadText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.destructive,
    marginTop: 2,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
