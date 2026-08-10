import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

// GET /api/profile/me — retourne les profils de l'utilisateur connecté
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      id: true,
      phone: true,
      email: true,
      createdAt: true,
      profiles: {
        select: {
          id: true,
          type: true,
          displayName: true,
          photoUrl: true,
          bio: true,
          region: true,
          verificationLevels: true,
          _count: { select: { fields: true, productions: true } },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  return NextResponse.json(user);
}
