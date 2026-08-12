import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { Button } from "../../src/components/Button";
import { TextInput } from "../../src/components/TextInput";
import { colors, spacing, fontSize, fontWeight } from "../../src/lib/tokens";
import { normalizeSenegalPhone, validateSenegalPhone } from "../../src/lib/phone-utils";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!phone.trim() || !password) {
      setError("Numéro de téléphone et mot de passe requis");
      return;
    }

    // Valider le format du numéro sénégalais
    const phoneError = validateSenegalPhone(phone.trim());
    if (phoneError) {
      setError(phoneError);
      return;
    }

    // Normaliser le numéro (ajouter +221 si nécessaire)
    const normalizedPhone = normalizeSenegalPhone(phone.trim());
    if (!normalizedPhone) {
      setError("Format de numéro invalide");
      return;
    }

    setError("");
    setLoading(true);
    const result = await login(normalizedPhone, password);
    setLoading(false);
    if (!result.ok) setError(result.error ?? "Identifiants incorrects");
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
        {/* Logo / marque */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🌱</Text>
          </View>
          <Text style={styles.brandName}>SunuAgri</Text>
          <Text style={styles.brandSub}>Connecter la terre et le marché</Text>
        </View>

        {/* Carte formulaire */}
        <View style={styles.card}>
          <Text style={styles.heading}>Connexion</Text>
          <Text style={styles.sub}>Accès à votre espace agricole</Text>

          <View style={styles.form}>
            <TextInput
              label="Numéro de téléphone"
              placeholder="77 123 45 67"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="next"
            />
            <TextInput
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} accessibilityRole="alert">
                  {error}
                </Text>
              </View>
            ) : null}

            <Button
              label="Se connecter"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: spacing.sm }}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              label="Connexion par OTP"
              variant="outline"
              onPress={() => router.push("/(auth)/otp-login")}
            />
          </View>
        </View>

        {/* Lien inscription */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={styles.footerLink}> Créer un compte</Text>
            </Pressable>
          </Link>
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
    paddingTop: 72,
    paddingBottom: 40,
    gap: spacing.xl,
  },
  brand: {
    alignItems: "center",
    gap: spacing.sm,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  logoIcon: {
    fontSize: 36,
  },
  brandName: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.text,
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
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
    marginBottom: spacing.lg,
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
