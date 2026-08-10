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
import { useAuth } from "../../src/hooks/useAuth";
import { Button } from "../../src/components/Button";
import { TextInput } from "../../src/components/TextInput";
import { colors, spacing, fontSize, fontWeight } from "../../src/lib/tokens";

type Step = "form" | "otp";

export default function RegisterScreen() {
  const { register, sendOtp, loginWithOtp } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!phone.trim() || !displayName.trim() || !password) {
      setError("Tous les champs sont requis");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères");
      return;
    }
    setError("");
    setLoading(true);
    const result = await register({ phone: phone.trim(), password, displayName: displayName.trim() });
    setLoading(false);
    if (!result.ok) { setError(result.error ?? "Erreur"); return; }
    setStep("otp");
  }

  async function handleVerifyOtp() {
    if (code.length !== 6) { setError("Le code doit contenir 6 chiffres"); return; }
    setError("");
    setLoading(true);
    const result = await loginWithOtp(phone.trim(), code.trim());
    setLoading(false);
    if (!result.ok) setError(result.error ?? "Code invalide ou expiré");
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

        <Text style={styles.heading}>
          {step === "form" ? "Créer un compte" : "Vérification"}
        </Text>
        <Text style={styles.sub}>
          {step === "form"
            ? "Rejoignez la plateforme agricole du Sénégal"
            : `Un code a été envoyé au ${phone}`}
        </Text>

        {step === "form" ? (
          <View style={styles.form}>
            <TextInput
              label="Votre nom / raison sociale"
              placeholder="Mamadou Diallo"
              value={displayName}
              onChangeText={setDisplayName}
              autoComplete="name"
              returnKeyType="next"
            />
            <TextInput
              label="Numéro de téléphone"
              placeholder="+221 7X XXX XX XX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="next"
            />
            <TextInput
              label="Mot de passe"
              placeholder="Au moins 8 caractères"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              hint="Minimum 8 caractères"
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
              </View>
            ) : null}

            <Button
              label="Créer mon compte"
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              label="Code OTP (6 chiffres)"
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
              </View>
            ) : null}

            <Button
              label="Vérifier et accéder"
              onPress={handleVerifyOtp}
              loading={loading}
            />
            <Button
              label="Renvoyer le code"
              variant="ghost"
              size="sm"
              onPress={() => sendOtp(phone.trim())}
            />
          </View>
        )}
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
