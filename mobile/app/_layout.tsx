import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../src/hooks/useAuth";
import { useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../src/lib/api";

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
      const hasCompleted = await AsyncStorage.getItem("hasCompletedOnboarding");

      if (hasCompleted === "true") {
        router.replace("/(app)/(tabs)/");
        return;
      }

      const { data } = await apiFetch<{ user: { hasCompletedOnboarding: boolean } }>(
        "/api/auth/me"
      );

      if (data?.user.hasCompletedOnboarding) {
        await AsyncStorage.setItem("hasCompletedOnboarding", "true");
        router.replace("/(app)/(tabs)/");
      } else {
        router.replace("/(auth)/onboarding/");
      }
    } catch (err) {
      console.error("Error checking onboarding:", err);
      router.replace("/(app)/(tabs)/");
    } finally {
      setCheckingOnboarding(false);
    }
  }

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootGuard />
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
