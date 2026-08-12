import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext, isAdmin } from "@/lib/auth/session";
import { ListingStatus } from "@/app/generated/prisma/client";

// GET /api/admin/listings — liste des annonces en attente de validation
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx || !isAdmin(ctx)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "all"; // "fields" | "productions" | "all"
  const status = (searchParams.get("status") ?? ListingStatus.PENDING_VALIDATION) as ListingStatus;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const results: { fields?: unknown[]; productions?: unknown[]; meta?: any } = {};
  let totalFields = 0;
  let totalProductions = 0;

  if (type === "all" || type === "fields") {
    const [items, count] = await Promise.all([
      prisma.field.findMany({
        where: { status },
        include: {
          profile: { select: { id: true, displayName: true, verificationLevels: true } },
          medias: { take: 1, orderBy: { orderIndex: "asc" } },
          documents: true,
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.field.count({ where: { status } }),
    ]);
    results.fields = items;
    totalFields = count;
  }

  if (type === "all" || type === "productions") {
    const [items, count] = await Promise.all([
      prisma.production.findMany({
        where: { status },
        include: {
          profile: { select: { id: true, displayName: true, verificationLevels: true } },
          medias: { take: 1, orderBy: { orderIndex: "asc" } },
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.production.count({ where: { status } }),
    ]);
    results.productions = items;
    totalProductions = count;
  }

  results.meta = {
    page,
    limit,
    totalFields,
    totalProductions,
    total: totalFields + totalProductions,
    totalPages: Math.ceil(Math.max(totalFields, totalProductions) / limit),
  };

  return NextResponse.json(results);
}

const actionSchema = z.object({
  listingType: z.enum(["field", "production"]),
  listingId: z.string(),
  action: z.enum(["approve", "reject", "suspend"]),
  reason: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

// PATCH /api/admin/listings — valider, rejeter ou suspendre une annonce
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

  const { listingType, listingId, action, reason, expiresAt } = parsed.data;

  const statusMap: Record<string, ListingStatus> = {
    approve: ListingStatus.PUBLISHED,
    reject: ListingStatus.REJECTED,
    suspend: ListingStatus.SUSPENDED,
  };

  const newStatus = statusMap[action];
  const publishedAt = action === "approve" ? new Date() : undefined;

  if (listingType === "field") {
    const updated = await prisma.field.update({
      where: { id: listingId },
      data: {
        status: newStatus,
        rejectionReason: action === "reject" ? reason : undefined,
        publishedAt,
        ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
      },
    });
    return NextResponse.json(updated);
  }

  const updated = await prisma.production.update({
    where: { id: listingId },
    data: {
      status: newStatus,
      rejectionReason: action === "reject" ? reason : undefined,
      publishedAt,
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
    },
  });

  return NextResponse.json(updated);
}
