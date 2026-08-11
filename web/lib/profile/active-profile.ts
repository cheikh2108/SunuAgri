/**
 * Gestion du profil actif côté client (web)
 * Le profil actif détermine quel profil effectue une action métier
 */

import { ProfileType } from "@/app/generated/prisma";

const ACTIVE_PROFILE_KEY = "sunuagri_active_profile";

export interface ActiveProfile {
  id: string;
  type: ProfileType;
  displayName: string;
}

/**
 * Récupère le profil actif depuis localStorage
 */
export function getActiveProfile(): ActiveProfile | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Définit le profil actif dans localStorage
 */
export function setActiveProfile(profile: ActiveProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));
}

/**
 * Supprime le profil actif de localStorage
 */
export function clearActiveProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
}

/**
 * Récupère l'ID du profil actif pour l'envoyer dans les headers API
 */
export function getActiveProfileId(): string | null {
  const profile = getActiveProfile();
  return profile?.id || null;
}

/**
 * Récupère le header X-Active-Profile pour les requêtes API
 */
export function getActiveProfileHeader(): Record<string, string> {
  const profileId = getActiveProfileId();
  return profileId ? { "X-Active-Profile": profileId } : {};
}
