import { prisma } from "@/lib/prisma";
import { verifyToken } from "./jwt";
import { AuthError } from "@/lib/errors";
import type { User, Profile, SystemRole, ProfileType } from "@/app/generated/prisma/client";

/**
 * User complet avec ses profils actifs
 */
export interface CurrentUser extends User {
  profiles: Profile[];
}

/**
 * Extrait et vérifie le JWT du header Authorization
 * Retourne le user avec ses profils actifs
 *
 * @throws {AuthError} si le token est absent, invalide, ou l'utilisateur n'existe pas
 */
export async function getCurrentUser(req: Request): Promise<CurrentUser> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new AuthError("Token d'authentification manquant", "MISSING_TOKEN");
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new AuthError("Token d'authentification invalide", "INVALID_TOKEN");
  }

  const payload = await verifyToken(token);
  if (!payload) {
    throw new AuthError("Token expiré ou invalide", "INVALID_TOKEN");
  }

  // Vérifier que la session existe et est valide
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: {
      user: {
        include: {
          profiles: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  if (!session || session.userId !== payload.userId) {
    throw new AuthError("Session invalide", "INVALID_SESSION");
  }

  if (session.revokedAt) {
    throw new AuthError("Session révoquée", "SESSION_REVOKED");
  }

  if (session.expiresAt < new Date()) {
    throw new AuthError("Session expirée", "SESSION_EXPIRED");
  }

  const user = session.user;

  if (!user.isActive) {
    throw new AuthError("Compte désactivé", "ACCOUNT_DISABLED");
  }

  if (user.isSuspended) {
    throw new AuthError(
      user.suspendReason || "Compte suspendu",
      "ACCOUNT_SUSPENDED"
    );
  }

  return user;
}

/**
 * Version optionnelle qui retourne null au lieu de throw
 * Utile pour les routes publiques qui veulent vérifier si un user est connecté
 */
export async function getCurrentUserOptional(
  req: Request
): Promise<CurrentUser | null> {
  try {
    return await getCurrentUser(req);
  } catch {
    return null;
  }
}
