import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export interface AuthContext {
  userId: string;
  sessionId: string;
  systemRole: string;
  profiles: { id: string; type: string }[];
}

// Extrait userId/token injectés par le middleware, crée/récupère la session en base
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const userId = req.headers.get("x-user-id");
  const token = req.headers.get("x-token");

  if (!userId || !token) return null;

  // Trouver ou créer une session pour ce token
  let session = await prisma.session.findFirst({
    where: {
      userId,
      token,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
  });

  // Si pas de session, en créer une
  if (!session) {
    // Vérifier que l'utilisateur existe et récupérer son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, systemRole: true },
    });

    if (!user) {
      // L'utilisateur n'existe plus (probablement supprimé de la BDD)
      return null;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 jours

    session = await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  // Récupérer le systemRole de l'utilisateur ET ses profils en une seule requête
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      systemRole: true,
      profiles: {
        where: { isActive: true },
        select: { id: true, type: true },
      },
    },
  });

  if (!user) return null;

  return {
    userId,
    sessionId: session.id,
    systemRole: user.systemRole,
    profiles: user.profiles,
  };
}

// Retourne le premier profil du type demandé, ou null
export function getProfile(ctx: AuthContext, type: string) {
  return ctx.profiles.find((p) => p.type === type) ?? null;
}

export function isAdmin(ctx: AuthContext) {
  return ctx.systemRole === "ADMIN" || ctx.systemRole === "SUPER_ADMIN";
}
