/**
 * Utilitaires pour la gestion des numéros de téléphone sénégalais
 */

/**
 * Préfixes valides pour les numéros sénégalais (opérateurs mobiles)
 * 70, 75, 76, 77, 78
 */
const SENEGAL_PREFIXES = ["70", "75", "76", "77", "78"];

/**
 * Normalise un numéro de téléphone sénégalais
 * - Accepte les formats : 77 123 45 67, 771234567, +221771234567
 * - Retourne le format international : +221771234567
 * - Retourne null si le format est invalide
 */
export function normalizeSenegalPhone(phone: string): string | null {
  if (!phone) return null;

  // Enlever tous les espaces, tirets, parenthèses
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Si commence par +221, enlever le préfixe
  if (cleaned.startsWith("+221")) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith("221")) {
    cleaned = cleaned.substring(3);
  }

  // À ce stade, on doit avoir 9 chiffres commençant par 7X
  if (!/^\d{9}$/.test(cleaned)) {
    return null;
  }

  // Vérifier que ça commence par un préfixe valide
  const prefix = cleaned.substring(0, 2);
  if (!SENEGAL_PREFIXES.includes(prefix)) {
    return null;
  }

  // Retourner au format international
  return `+221${cleaned}`;
}

/**
 * Valide qu'un numéro est au format sénégalais valide
 */
export function isValidSenegalPhone(phone: string): boolean {
  return normalizeSenegalPhone(phone) !== null;
}

/**
 * Formate un numéro pour l'affichage
 * +221771234567 → 77 123 45 67
 */
export function formatSenegalPhone(phone: string): string {
  const normalized = normalizeSenegalPhone(phone);
  if (!normalized) return phone;

  // Enlever le +221
  const digits = normalized.substring(4);

  // Formater : 77 123 45 67
  return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5, 7)} ${digits.substring(7, 9)}`;
}

/**
 * Retourne un message d'erreur si le numéro est invalide
 */
export function validateSenegalPhone(phone: string): string | null {
  if (!phone || phone.trim() === "") {
    return "Le numéro de téléphone est requis";
  }

  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Si commence par +221 ou 221
  let digits = cleaned;
  if (digits.startsWith("+221")) {
    digits = digits.substring(4);
  } else if (digits.startsWith("221")) {
    digits = digits.substring(3);
  }

  // Vérifier que ce sont bien 9 chiffres
  if (!/^\d{9}$/.test(digits)) {
    return "Le numéro doit contenir 9 chiffres (ex: 77 123 45 67)";
  }

  // Vérifier le préfixe
  const prefix = digits.substring(0, 2);
  if (!SENEGAL_PREFIXES.includes(prefix)) {
    return `Le numéro doit commencer par ${SENEGAL_PREFIXES.join(", ")}`;
  }

  return null; // Valide
}
