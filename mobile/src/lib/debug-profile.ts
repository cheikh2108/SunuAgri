/**
 * Utilitaire de débogage pour vérifier le profil actif
 */

import { getActiveProfile } from "./active-profile";

export async function debugActiveProfile() {
  const profile = await getActiveProfile();
  console.log("=".repeat(60));
  console.log("🔍 DEBUG: Active Profile");
  console.log("=".repeat(60));
  if (profile) {
    console.log("✅ Profile found:");
    console.log("   ID:", profile.id);
    console.log("   Type:", profile.type);
    console.log("   Display Name:", profile.displayName);
  } else {
    console.log("❌ No active profile found in AsyncStorage");
  }
  console.log("=".repeat(60));
  return profile;
}
