import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../src/hooks/useAuth";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../src/lib/api";
import { setActiveProfile } from "../src/lib/active-profile";

function RootGuard() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(auth)" && segments[1] === "onboarding";

    if (!token && !inAuth) {
      router.replace("/(auth)/login");
    } else if (token && inAuth && !inOnboarding) {
      checkOnboardingAndRedirect();
    }
  }, [token, loading, segments]);

  async function checkOnboardingAndRedirect() {
    if (checkingOnboarding) return;
    setCheckingOnboarding(true);

    try {
      // Toujours vérifier l'API d'abord (source de vérité)
      const { data, error } = await apiFetch<{
        user: { hasCompletedOnboarding: boolean };
        profiles: Array<{ id: string; type: string; displayName: string }>;
      }>("/api/auth/me");

      if (error || !data?.user) {
        // Si erreur API, déconnecter l'utilisateur
        console.error("Error fetching user:", error);
        await AsyncStorage.removeItem("hasCompletedOnboarding");
        router.replace("/(auth)/login");
        return;
      }

      // Définir le profil actif (prendre le premier disponible)
      if (data.profiles && data.profiles.length > 0) {
        await setActiveProfile({
          id: data.profiles[0].id,
          type: data.profiles[0].type as any,
          displayName: data.profiles[0].displayName,
        });
      }

      // Synchroniser AsyncStorage avec la valeur de l'API
      if (data.user.hasCompletedOnboarding) {
        await AsyncStorage.setItem("hasCompletedOnboarding", "true");
        router.replace("/(app)/(tabs)/");
      } else {
        await AsyncStorage.removeItem("hasCompletedOnboarding");
        router.replace("/(auth)/onboarding/");
      }
    } catch (err) {
      console.error("Error checking onboarding:", err);
      // En cas d'erreur, nettoyer AsyncStorage et rediriger vers l'onboarding
      await AsyncStorage.removeItem("hasCompletedOnboarding");
      router.replace("/(auth)/onboarding/");
    } finally {
      setCheckingOnboarding(false);
    }
  }

  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootGuard />
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ThemeProvider>
  );
}
