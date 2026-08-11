import { useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../lib/api";

interface User {
  id: string;
  phone: string;
  hasCompletedOnboarding: boolean;
  profiles: Array<{ id: string; type: string }>;
}

export function useOnboarding() {
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  async function checkOnboardingStatus() {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem("hasCompletedOnboarding");

      if (hasCompletedOnboarding === "true") {
        setLoading(false);
        return;
      }

      const { data, error } = await apiFetch<{ user: User }>("/api/auth/me");

      if (error || !data) {
        setLoading(false);
        return;
      }

      setUser(data.user);

      const inAuth = segments[0] === "(auth)";
      const inOnboarding = segments[0] === "(auth)" && segments[1] === "onboarding";

      if (!data.user.hasCompletedOnboarding && !inOnboarding) {
        router.replace("/(auth)/onboarding/");
      } else if (data.user.hasCompletedOnboarding && data.user.profiles.length > 0) {
        const activeProfileId = data.user.profiles[0].id;
        await AsyncStorage.setItem("activeProfileId", activeProfileId);
        await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      }
    } catch (err) {
      console.error("Error checking onboarding status:", err);
    } finally {
      setLoading(false);
    }
  }

  return { loading, user, checkOnboardingStatus };
}
