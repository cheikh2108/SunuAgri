import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext, isAdmin } from "@/lib/auth/session";
import { VerificationLevel } from "@/app/generated/prisma/client";

// GET /api/admin/users — liste des utilisateurs
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx || !isAdmin(ctx)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? undefined;
  const isSuspended = searchParams.get("suspended") === "true" ? true : undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const users = await prisma.user.findMany({
    where: {
      ...(isSuspended !== undefined ? { isSuspended } : {}),
      ...(search
        ? {
            OR: [
              { phone: { contains: search } },
              { email: { contains: search, mode: "insensitive" } },
              { profiles: { some: { displayName: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      phone: true,
      email: true,
      isActive: true,
      isSuspended: true,
      suspendedAt: true,
      suspendReason: true,
      createdAt: true,
      profiles: {
        select: {
          id: true,
          type: true,
          displayName: true,
          verificationLevels: true,
          _count: { select: { fields: true, productions: true } },
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.user.count({
    where: {
      ...(isSuspended !== undefined ? { isSuspended } : {}),
    },
  });

  return NextResponse.json({ data: users, total, page, limit });
}

const actionSchema = z.object({
  userId: z.string(),
  action: z.enum(["suspend", "reactivate", "verify_id", "verify_org"]),
  reason: z.string().max(500).optional(),
  profileId: z.string().optional(),
});

// PATCH /api/admin/users — suspendre, réactiver ou vérifier un utilisateur
export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx || !isAdmin(ctx)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { userId, action, reason, profileId } = parsed.data;

  if (action === "suspend") {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true, suspendedAt: new Date(), suspendReason: reason },
    });
    // Révoquer toutes les sessions actives
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  if (action === "reactivate") {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false, suspendedAt: null, suspendReason: null },
    });
    return NextResponse.json(updated);
  }

  // Ajouter un badge de vérification sur le profil
  const verificationMap: Record<string, VerificationLevel> = {
    verify_id: VerificationLevel.ID_VERIFIED,
    verify_org: VerificationLevel.ORG_VERIFIED,
  };

  if (!profileId) {
    return NextResponse.json({ error: "profileId requis pour la vérification" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const newLevel = verificationMap[action];
  const already = profile.verificationLevels.includes(newLevel);

  const updated = already
    ? profile
    : await prisma.profile.update({
        where: { id: profileId },
        data: { verificationLevels: { push: newLevel } },
      });

  return NextResponse.json(updated);
}
