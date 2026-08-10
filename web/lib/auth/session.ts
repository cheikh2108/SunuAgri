import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export interface AuthContext {
  userId: string;
  sessionId: string;
  profiles: { id: string; type: string }[];
}

// Extrait userId/sessionId injectés par le middleware, vérifie la session en base
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const userId = req.headers.get("x-user-id");
  const sessionId = req.headers.get("x-session-id");

  if (!userId || !sessionId) return null;

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: new Date() } },
  });

  if (!session) return null;

  const profiles = await prisma.profile.findMany({
    where: { userId, isActive: true },
    select: { id: true, type: true },
  });

  return { userId, sessionId, profiles };
}

// Retourne le premier profil du type demandé, ou null
export function getProfile(ctx: AuthContext, type: string) {
  return ctx.profiles.find((p) => p.type === type) ?? null;
}

export function isAdmin(ctx: AuthContext) {
  return ctx.profiles.some((p) => p.type === "ADMIN" || p.type === "SUPER_ADMIN");
}
