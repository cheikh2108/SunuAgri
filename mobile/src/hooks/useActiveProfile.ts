import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../lib/api";

interface Profile {
  id: string;
  type: "OWNER" | "PRODUCER" | "BUYER" | "INVESTOR" | "PROVIDER";
  displayName: string;
}

interface UseActiveProfileResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useActiveProfile(): UseActiveProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      // Récupérer le profil actif depuis l'API
      const { data, error: apiError } = await apiFetch<{
        user: {
          profiles: Profile[];
        };
      }>(
        "/api/auth/me"
      );

      if (apiError || !data?.user) {
        setError(apiError ?? "Erreur lors du chargement du profil");
        setProfile(null);
        return;
      }

      // Récupérer l'ID du profil actif depuis AsyncStorage
      const activeProfileId = await AsyncStorage.getItem("activeProfileId");

      if (activeProfileId && data.user.profiles.length > 0) {
        // Trouver le profil actif
        const activeProfile = data.user.profiles.find(p => p.id === activeProfileId);
        setProfile(activeProfile || data.user.profiles[0]);
      } else if (data.user.profiles.length > 0) {
        // Prendre le premier profil par défaut
        setProfile(data.user.profiles[0]);
        await AsyncStorage.setItem("activeProfileId", data.user.profiles[0].id);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Error loading active profile:", err);
      setError("Erreur lors du chargement du profil");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    refresh: loadProfile,
  };
}
