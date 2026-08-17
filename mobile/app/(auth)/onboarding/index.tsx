import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { spacing, fontSize, fontWeight, radius } from "../../../src/lib/tokens";
import { useTheme } from "../../../src/contexts/ThemeContext";

interface ProfileOption {
  icon: string;
  label: string;
  description: string;
  type: string;
  route: string;
}

const profileOptions: ProfileOption[] = [
  {
    icon: "📍",
    label: "J'ai une terre à louer/vendre",
    description: "Propriétaire foncier",
    type: "OWNER",
    route: "/onboarding/owner",
  },
  {
    icon: "🌾",
    label: "Je veux vendre ma production",
    description: "Producteur agricole",
    type: "PRODUCER",
    route: "/onboarding/producer",
  },
  {
    icon: "🛒",
    label: "Je veux acheter des produits",
    description: "Acheteur",
    type: "BUYER",
    route: "/onboarding/buyer",
  },
  {
    icon: "💰",
    label: "Je cherche à investir",
    description: "Investisseur",
    type: "INVESTOR",
    route: "/onboarding/investor",
  },
  {
    icon: "🚜",
    label: "J'offre des services agricoles",
    description: "Prestataire",
    type: "PROVIDER",
    route: "/onboarding/provider",
  },
];

export default function OnboardingChoiceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>🌱 SunuAgri</Text>
        <Text style={styles.heading}>👋 Bienvenue !</Text>
        <Text style={styles.sub}>
          Que voulez-vous faire sur SunuAgri ?
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {profileOptions.map((option) => (
          <TouchableOpacity
            key={option.type}
            style={styles.optionCard}
            activeOpacity={0.7}
            onPress={() => router.push(option.route as any)}
            accessibilityRole="button"
            accessibilityLabel={`${option.label} - ${option.description}`}
          >
            <Text style={styles.optionIcon}>{option.icon}</Text>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => router.replace("/(app)/(tabs)")}
        accessibilityRole="button"
        accessibilityHint="Accéder à l'application sans créer de profil (navigation limitée)"
      >
        <Text style={styles.skipText}>Continuer sans profil</Text>
        <Text style={styles.skipHint}>(navigation limitée)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing["2xl"],
  },
  logo: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sub: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: spacing.md,
    marginBottom: spacing["2xl"],
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 80,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 28,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: spacing.base,
  },
  skipText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  skipHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
