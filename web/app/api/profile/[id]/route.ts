import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext, isAdmin } from "@/lib/auth/session";

// GET /api/profile/[id] — profil public
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profile = await prisma.profile.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      displayName: true,
      photoUrl: true,
      bio: true,
      region: true,
      department: true,
      commune: true,
      locality: true,
      activityArea: true,
      verificationLevels: true,
      avgResponseHours: true,
      createdAt: true,
      // Téléphone masqué par défaut — règle §7 CLAUDE.md
      phoneVisible: true,
      _count: {
        select: {
          fields: true,
          productions: true,
          reviewsReceived: true,
        },
      },
      reviewsReceived: {
        where: { isModerated: true, publishedAt: { not: null } },
        select: {
          reliability: true,
          conformity: true,
          punctuality: true,
          communication: true,
          commitment: true,
          comment: true,
          publishedAt: true,
          authorProfile: { select: { id: true, displayName: true, photoUrl: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!profile || !profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  // Exposer le téléphone seulement si le profil l'autorise explicitement
  const ctx = await getAuthContext(req);
  const isSelf = ctx?.profiles.some((p) => p.id === id);
  const admin = ctx ? isAdmin(ctx) : false;

  const user = isSelf || admin
    ? await prisma.user.findFirst({
        where: { profiles: { some: { id } } },
        select: { phone: true, email: true },
      })
    : null;

  return NextResponse.json({
    ...profile,
    phone: profile.phoneVisible || isSelf || admin ? user?.phone ?? null : null,
    email: isSelf || admin ? user?.email ?? null : null,
  });
}

const patchSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  photoUrl: z.string().url().optional(),
  bio: z.string().max(1000).optional(),
  region: z.string().optional(),
  department: z.string().optional(),
  commune: z.string().optional(),
  locality: z.string().optional(),
  activityArea: z.string().optional(),
  phoneVisible: z.boolean().optional(),
});

// PATCH /api/profile/[id] — modifier son propre profil
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const isSelf = ctx.profiles.some((p) => p.id === id);
  if (!isSelf && !isAdmin(ctx)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updated = await prisma.profile.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
