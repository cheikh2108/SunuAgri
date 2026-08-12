/**
 * Utilitaires pour la gestion des numéros de téléphone sénégalais
 */

const SENEGAL_PREFIXES = ["70", "75", "76", "77", "78"];

/**
 * Normalise un numéro de téléphone sénégalais au format international
 * Accepte : 77 123 45 67, 771234567, +221771234567, 221771234567
 * Retourne : +221771234567 ou null si invalide
 */
export function normalizeSenegalPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Enlever tous les espaces, tirets, parenthèses
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Enlever le préfixe international si présent
  if (cleaned.startsWith("+221")) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith("221")) {
    cleaned = cleaned.substring(3);
  }

  // Vérifier qu'on a 9 chiffres
  if (!/^\d{9}$/.test(cleaned)) {
    return null;
  }

  // Vérifier le préfixe opérateur
  const prefix = cleaned.substring(0, 2);
  if (!SENEGAL_PREFIXES.includes(prefix)) {
    return null;
  }

  return `+221${cleaned}`;
}

/**
 * Valide un numéro de téléphone sénégalais
 */
export function isValidSenegalPhone(phone: string): boolean {
  return normalizeSenegalPhone(phone) !== null;
}
