import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "./session";
import { ProfileType } from "@/app/generated/prisma/client";

/**
 * Récupère le User complet avec tous ses profils actifs
 */
export async function getCurrentUser(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentification requise");
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    include: {
      profiles: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user || user.isSuspended) {
    throw new ApiError(403, "ACCOUNT_SUSPENDED", "Compte suspendu");
  }

  return user;
}

/**
 * Récupère un profil spécifique et vérifie qu'il appartient au user
 */
export async function getProfileById(req: NextRequest, profileId: string) {
  const user = await getCurrentUser(req);

  const profile = await prisma.profile.findFirst({
    where: {
      id: profileId,
      userId: user.id,
      isActive: true,
    },
  });

  if (!profile) {
    throw new ApiError(404, "PROFILE_NOT_FOUND", "Profil introuvable");
  }

  return { user, profile };
}

/**
 * Vérifie qu'un profil d'un type donné existe pour le user
 * Utilisé pour protéger les routes qui nécessitent un type de profil spécifique
 */
export async function requireProfile(req: NextRequest, type: ProfileType) {
  const user = await getCurrentUser(req);

  const profile = user.profiles.find((p) => p.type === type);

  if (!profile) {
    throw new ApiError(
      403,
      "PROFILE_REQUIRED",
      `Cette action nécessite un profil ${type}`
    );
  }

  return { user, profile };
}

/**
 * Récupère le profil actif depuis le header X-Active-Profile
 */
export async function getActiveProfile(req: NextRequest) {
  const user = await getCurrentUser(req);
  const activeProfileId = req.headers.get("X-Active-Profile");

  if (!activeProfileId) {
    throw new ApiError(
      400,
      "ACTIVE_PROFILE_REQUIRED",
      "Vous devez sélectionner un profil actif"
    );
  }

  const profile = user.profiles.find((p) => p.id === activeProfileId);

  if (!profile) {
    throw new ApiError(
      403,
      "INVALID_PROFILE",
      "Ce profil ne vous appartient pas ou n'existe pas"
    );
  }

  return { user, profile };
}

/**
 * Classe d'erreur API personnalisée
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
