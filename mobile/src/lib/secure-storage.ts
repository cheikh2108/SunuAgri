import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Stockage sécurisé pour les données sensibles (tokens, credentials)
 * Utilise SecureStore (chiffré) pour les tokens et AsyncStorage pour les préférences
 */

const KEYS = {
  AUTH_TOKEN: 'auth_token',
  ACTIVE_PROFILE: 'active_profile',
  HAS_COMPLETED_ONBOARDING: 'hasCompletedOnboarding',
  THEME: '@sunuagri_theme',
};

/**
 * Sauvegarde le token d'authentification de manière sécurisée
 */
export async function saveAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
}

/**
 * Récupère le token d'authentification
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Supprime le token d'authentification
 */
export async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
}

/**
 * Sauvegarde le profil actif (non sensible, peut rester dans AsyncStorage)
 */
export async function saveActiveProfile(profile: any): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVE_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving active profile:', error);
  }
}

/**
 * Récupère le profil actif
 */
export async function getActiveProfile(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.ACTIVE_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting active profile:', error);
    return null;
  }
}

/**
 * Supprime le profil actif
 */
export async function removeActiveProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.ACTIVE_PROFILE);
  } catch (error) {
    console.error('Error removing active profile:', error);
  }
}

/**
 * Nettoie toutes les données d'authentification (logout complet)
 */
export async function clearAuthData(): Promise<void> {
  await Promise.all([
    removeAuthToken(),
    removeActiveProfile(),
    AsyncStorage.removeItem(KEYS.HAS_COMPLETED_ONBOARDING),
  ]);
}

/**
 * Vérifie si un token existe
 */
export async function hasAuthToken(): Promise<boolean> {
  const token = await getAuthToken();
  return token !== null && token.length > 0;
}
