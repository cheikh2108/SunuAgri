import { getCurrentUser, type CurrentUser } from "./getCurrentUser";
import { AuthError, ForbiddenError } from "@/lib/errors";
import type { SystemRole, ProfileType, Profile } from "@/app/generated/prisma/client";

/**
 * Guards d'authentification et de permissions pour les routes API
 */

/**
 * Vérifie qu'un utilisateur est authentifié
 * @throws {AuthError} si non authentifié
 */
export async function requireAuth(req: Request): Promise<CurrentUser> {
  return getCurrentUser(req);
}

/**
 * Vérifie que l'utilisateur a le rôle système requis
 * Supporte un seul rôle ou un tableau de rôles acceptés
 *
 * @example
 * const user = await requireSystemRole(req, 'ADMIN');
 * const user = await requireSystemRole(req, ['ADMIN', 'SUPER_ADMIN']);
 */
export async function requireSystemRole(
  req: Request,
  role: SystemRole | SystemRole[]
): Promise<CurrentUser> {
  const user = await getCurrentUser(req);

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(user.systemRole)) {
    throw new ForbiddenError(
      `Rôle système requis : ${allowedRoles.join(" ou ")}`,
      "INSUFFICIENT_SYSTEM_ROLE"
    );
  }

  return user;
}

/**
 * Vérifie que l'utilisateur a complété l'onboarding (créé au moins 1 profil)
 * @throws {ForbiddenError} si l'onboarding n'est pas terminé
 */
export async function requireOnboarding(req: Request): Promise<CurrentUser> {
  const user = await getCurrentUser(req);

  if (!user.hasCompletedOnboarding) {
    throw new ForbiddenError(
      "Veuillez compléter votre profil avant d'accéder à cette fonctionnalité",
      "ONBOARDING_REQUIRED"
    );
  }

  return user;
}

/**
 * Vérifie que l'utilisateur possède un profil du type demandé
 * Retourne le profil trouvé
 *
 * @throws {ForbiddenError} si le profil n'existe pas
 *
 * @example
 * const ownerProfile = await requireProfile(req, 'OWNER');
 */
export async function requireProfile(
  req: Request,
  type: ProfileType
): Promise<Profile> {
  const user = await getCurrentUser(req);

  const profile = user.profiles.find((p) => p.type === type);

  if (!profile) {
    throw new ForbiddenError(
      `Profil ${type} requis pour effectuer cette action`,
      "PROFILE_REQUIRED"
    );
  }

  return profile;
}

/**
 * Récupère le profil actif depuis le header X-Active-Profile
 * Vérifie que le profil appartient bien à l'utilisateur connecté
 *
 * @throws {ForbiddenError} si le header est absent ou le profil invalide
 *
 * @example
 * // Frontend envoie : X-Active-Profile: clx123abc
 * const profile = await getActiveProfile(req);
 */
export async function getActiveProfile(req: Request): Promise<Profile> {
  const user = await getCurrentUser(req);

  const profileId = req.headers.get("X-Active-Profile");

  if (!profileId) {
    throw new ForbiddenError(
      "Header X-Active-Profile manquant",
      "ACTIVE_PROFILE_REQUIRED"
    );
  }

  const profile = user.profiles.find((p) => p.id === profileId);

  if (!profile) {
    throw new ForbiddenError(
      "Le profil spécifié n'existe pas ou n'appartient pas à cet utilisateur",
      "INVALID_ACTIVE_PROFILE"
    );
  }

  return profile;
}

/**
 * Vérifie que l'utilisateur a complété l'onboarding ET possède un profil du type demandé
 * Combinaison de requireOnboarding + requireProfile
 *
 * @example
 * const ownerProfile = await requireProfileWithOnboarding(req, 'OWNER');
 */
export async function requireProfileWithOnboarding(
  req: Request,
  type: ProfileType
): Promise<Profile> {
  await requireOnboarding(req);
  return requireProfile(req, type);
}

/**
 * Vérifie que le profil actif (X-Active-Profile) correspond au type demandé
 *
 * @example
 * const ownerProfile = await requireActiveProfileType(req, 'OWNER');
 */
export async function requireActiveProfileType(
  req: Request,
  type: ProfileType
): Promise<Profile> {
  const profile = await getActiveProfile(req);

  if (profile.type !== type) {
    throw new ForbiddenError(
      `Le profil actif doit être de type ${type}`,
      "INVALID_PROFILE_TYPE"
    );
  }

  return profile;
}

/**
 * Vérifie que l'utilisateur est un admin (ADMIN ou SUPER_ADMIN)
 */
export async function requireAdmin(req: Request): Promise<CurrentUser> {
  return requireSystemRole(req, ["ADMIN", "SUPER_ADMIN"]);
}

/**
 * Vérifie que l'utilisateur est SUPER_ADMIN
 */
export async function requireSuperAdmin(req: Request): Promise<CurrentUser> {
  return requireSystemRole(req, "SUPER_ADMIN");
}

/**
 * Vérifie que l'utilisateur est un agent (AGENT, ADMIN, ou SUPER_ADMIN)
 */
export async function requireAgent(req: Request): Promise<CurrentUser> {
  return requireSystemRole(req, ["AGENT", "ADMIN", "SUPER_ADMIN"]);
}
