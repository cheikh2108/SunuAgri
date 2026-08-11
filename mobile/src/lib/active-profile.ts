/**
 * Gestion du profil actif côté mobile (React Native)
 * Le profil actif détermine quel profil effectue une action métier
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const ACTIVE_PROFILE_KEY = "@sunuagri_active_profile";

export interface ActiveProfile {
  id: string;
  type: "OWNER" | "PRODUCER" | "BUYER" | "INVESTOR" | "PROVIDER";
  displayName: string;
}

/**
 * Récupère le profil actif depuis AsyncStorage
 */
export async function getActiveProfile(): Promise<ActiveProfile | null> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil actif:", error);
    return null;
  }
}

/**
 * Définit le profil actif dans AsyncStorage
 */
export async function setActiveProfile(profile: ActiveProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du profil actif:", error);
  }
}

/**
 * Supprime le profil actif d'AsyncStorage
 */
export async function clearActiveProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
  } catch (error) {
    console.error("Erreur lors de la suppression du profil actif:", error);
  }
}

/**
 * Récupère l'ID du profil actif pour l'envoyer dans les headers API
 */
export async function getActiveProfileId(): Promise<string | null> {
  const profile = await getActiveProfile();
  return profile?.id || null;
}

/**
 * Récupère le header X-Active-Profile pour les requêtes API
 */
export async function getActiveProfileHeader(): Promise<Record<string, string>> {
  const profileId = await getActiveProfileId();
  return profileId ? { "X-Active-Profile": profileId } : {};
}
