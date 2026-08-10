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
import { colors, spacing, fontSize, fontWeight, radius } from "../../src/lib/tokens";

type Step = "phone" | "code";

export default function OtpLoginScreen() {
  const { sendOtp, loginWithOtp } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (!phone.trim()) { setError("Numéro requis"); return; }
    setError("");
    setLoading(true);
    const result = await sendOtp(phone.trim());
    setLoading(false);
    if (!result.ok) { setError(result.error ?? "Erreur"); return; }
    setStep("code");
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
          {step === "phone" ? "Connexion par SMS" : "Entrez le code"}
        </Text>
        <Text style={styles.sub}>
          {step === "phone"
            ? "Nous vous enverrons un code de vérification"
            : `Code envoyé au ${phone}`}
        </Text>

        <View style={styles.form}>
          {step === "phone" ? (
            <TextInput
              label="Numéro de téléphone"
              placeholder="+221 7X XXX XX XX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              autoFocus
            />
          ) : (
            <TextInput
              label="Code OTP (6 chiffres)"
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
            </View>
          ) : null}

          <Button
            label={step === "phone" ? "Envoyer le code" : "Vérifier le code"}
            onPress={step === "phone" ? handleSendOtp : handleVerifyOtp}
            loading={loading}
          />

          {step === "code" && (
            <Button
              label="Changer de numéro"
              variant="ghost"
              size="sm"
              onPress={() => { setStep("phone"); setCode(""); setError(""); }}
            />
          )}
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
