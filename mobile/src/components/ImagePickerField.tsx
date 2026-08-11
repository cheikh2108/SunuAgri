import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, spacing, radius, fontSize, fontWeight } from "../lib/tokens";

interface Props {
  label?: string;
  value: string | null;
  onValueChange: (uri: string | null) => void;
  error?: string;
}

export function ImagePickerField({ label, value, onValueChange, error }: Props) {
  async function pickImage() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission requise",
        "Veuillez autoriser l'accès à vos photos pour ajouter une image de profil."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      onValueChange(result.assets[0].uri);
    }
  }

  async function takePhoto() {
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
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      onValueChange(result.assets[0].uri);
    }
  }

  function showOptions() {
    Alert.alert("Ajouter une photo", "Choisissez une source", [
      { text: "Prendre une photo", onPress: takePhoto },
      { text: "Choisir depuis la galerie", onPress: pickImage },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      {value ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: value }} style={styles.image} />
          <TouchableOpacity
            style={styles.changeButton}
            onPress={showOptions}
            accessibilityRole="button"
            accessibilityLabel="Modifier la photo"
          >
            <Text style={styles.changeButtonText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onValueChange(null)}
            accessibilityRole="button"
            accessibilityLabel="Supprimer la photo"
          >
            <Text style={styles.removeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.placeholder, error && styles.placeholderError]}
          onPress={showOptions}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une photo de profil"
        >
          <Text style={styles.placeholderIcon}>📷</Text>
          <Text style={styles.placeholderText}>Ajouter une photo</Text>
        </TouchableOpacity>
      )}

      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
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
  placeholder: {
    height: 120,
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
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  placeholderText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  imageContainer: {
    position: "relative",
    alignSelf: "flex-start",
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  changeButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
    paddingVertical: spacing.xs,
    alignItems: "center",
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  changeButtonText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.destructive,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  removeIcon: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.destructive,
    marginTop: 2,
  },
});
