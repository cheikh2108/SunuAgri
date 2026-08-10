import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";
import { ListingStatus } from "@/app/generated/prisma/client";

const createSchema = z.object({
  product: z.string().min(2),
  category: z.string(),
  quantity: z.number().positive(),
  quantityUnit: z.string(),
  quality: z.string().optional(),
  frequency: z.string().optional(),
  budget: z.number().positive().optional(),
  currency: z.string().default("XOF"),
  deadline: z.string().datetime().optional(),
  deliveryLocation: z.string().optional(),
  paymentConditions: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

// POST /api/supply-needs — publier un besoin d'approvisionnement
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const buyerProfile = ctx.profiles.find((p) =>
    ["BUYER", "PRODUCER", "INVESTOR"].includes(p.type)
  );
  if (!buyerProfile) {
    return NextResponse.json({ error: "Profil acheteur requis" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  const supplyNeed = await prisma.supplyNeed.create({
    data: {
      profileId: buyerProfile.id,
      product: data.product,
      category: data.category,
      quantity: data.quantity,
      quantityUnit: data.quantityUnit,
      quality: data.quality,
      frequency: data.frequency,
      budget: data.budget,
      currency: data.currency,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      deliveryLocation: data.deliveryLocation,
      paymentConditions: data.paymentConditions,
      status: ListingStatus.PUBLISHED,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  });

  // Matching simple — notifier les producteurs qui ont une production publiée
  // dans la même catégorie (règle §6.3 : matching par catégorie en MVP)
  await triggerSupplyNeedNotifications(supplyNeed.id, data.category);

  return NextResponse.json(supplyNeed, { status: 201 });
}

// GET /api/supply-needs — liste publique des besoins
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const category = searchParams.get("category") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const needs = await prisma.supplyNeed.findMany({
    where: {
      status: ListingStatus.PUBLISHED,
      expiresAt: { gt: new Date() },
      ...(category && { category }),
    },
    include: {
      profile: {
        select: { id: true, displayName: true, verificationLevels: true, region: true },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.supplyNeed.count({
    where: {
      status: ListingStatus.PUBLISHED,
      expiresAt: { gt: new Date() },
      ...(category && { category }),
    },
  });

  return NextResponse.json({ data: needs, total, page, limit });
}

// Matching simple catégorie → crée des notifications pour les producteurs concernés
async function triggerSupplyNeedNotifications(supplyNeedId: string, category: string) {
  const matchingProductions = await prisma.production.findMany({
    where: {
      status: ListingStatus.PUBLISHED,
      category,
      quantityAvailable: { gt: 0 },
    },
    select: { profileId: true },
    distinct: ["profileId"],
    take: 100,
  });

  if (matchingProductions.length === 0) return;

  await prisma.notification.createMany({
    data: matchingProductions.map((p) => ({
      profileId: p.profileId,
      channel: "IN_APP" as const,
      type: "SUPPLY_NEED_MATCH",
      title: "Nouveau besoin d'approvisionnement",
      body: `Un acheteur recherche des produits dans la catégorie "${category}".`,
      payload: { supplyNeedId },
    })),
    skipDuplicates: true,
  });
}
