import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";

// GET /api/notifications — notifications de l'utilisateur connecté
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profileIds = ctx.profiles.map((p) => p.id);
  const { searchParams } = req.nextUrl;
  const unreadOnly = searchParams.get("unread") === "true";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const notifications = await prisma.notification.findMany({
    where: {
      profileId: { in: profileIds },
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: { profileId: { in: profileIds }, isRead: false },
  });

  return NextResponse.json({ data: notifications, unreadCount, page, limit });
}

const patchSchema = z.object({
  ids: z.array(z.string()).min(1).optional(),
  all: z.boolean().optional(),
});

// PATCH /api/notifications — marquer comme lu
export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profileIds = ctx.profiles.map((p) => p.id);
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { ids, all } = parsed.data;

  await prisma.notification.updateMany({
    where: {
      profileId: { in: profileIds },
      ...(all ? {} : { id: { in: ids } }),
    },
    data: { isRead: true },
  });

  return NextResponse.json({ message: "Notifications marquées comme lues" });
}
