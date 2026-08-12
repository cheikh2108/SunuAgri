import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";
import { ListingStatus, ProductionOfferType } from "@/app/generated/prisma/client";

const createSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.string(),
  variety: z.string().optional(),
  offerType: z.nativeEnum(ProductionOfferType),
  quantityAvailable: z.number().positive(),
  quantityUnit: z.string(),
  minOrderQuantity: z.number().positive().optional(),
  price: z.number().positive(),
  isPriceNegotiable: z.boolean().default(false),
  quality: z.string().optional(),
  caliber: z.string().optional(),
  productionMode: z.string().optional(),
  harvestDate: z.string().datetime().optional(),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
  region: z.string(),
  department: z.string().optional(),
  commune: z.string().optional(),
  storageConditions: z.string().optional(),
  deliveryModes: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
  mediaUrls: z.array(z.object({
    url: z.string(),
    mediaId: z.string(),
  })).optional(),
});

// POST /api/productions — créer une production (brouillon)
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const producerProfile = ctx.profiles.find((p) =>
    ["PRODUCER", "OWNER"].includes(p.type)
  );
  if (!producerProfile) {
    return NextResponse.json({ error: "Profil producteur requis" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  const production = await prisma.production.create({
    data: {
      profileId: producerProfile.id,
      name: data.name,
      category: data.category,
      variety: data.variety,
      offerType: data.offerType,
      status: ListingStatus.DRAFT,
      quantityAvailable: data.quantityAvailable,
      quantityUnit: data.quantityUnit,
      minOrderQuantity: data.minOrderQuantity,
      price: data.price,
      isPriceNegotiable: data.isPriceNegotiable,
      quality: data.quality,
      caliber: data.caliber,
      productionMode: data.productionMode,
      harvestDate: data.harvestDate ? new Date(data.harvestDate) : undefined,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
      availableUntil: data.availableUntil ? new Date(data.availableUntil) : undefined,
      region: data.region,
      department: data.department,
      commune: data.commune,
      storageConditions: data.storageConditions,
      deliveryModes: data.deliveryModes,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      medias: data.mediaUrls
        ? {
            create: data.mediaUrls.map((media, index) => ({
              url: media.url,
              mediaType: "image",
              orderIndex: index,
            })),
          }
        : undefined,
    },
    select: { id: true, name: true, status: true, createdAt: true },
  });

  return NextResponse.json(production, { status: 201 });
}

// GET /api/productions — recherche publique ou mes productions
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const mine = searchParams.get("mine") === "true";
  const category = searchParams.get("category") ?? undefined;
  const region = searchParams.get("region") ?? undefined;
  const offerType = searchParams.get("offerType") as ProductionOfferType | null;
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  // Si mine=true, l'utilisateur doit être authentifié
  let profileId: string | undefined;
  if (mine) {
    const ctx = await getAuthContext(req);
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const producerProfile = ctx.profiles.find((p) =>
      ["PRODUCER", "OWNER"].includes(p.type)
    );
    if (!producerProfile) {
      return NextResponse.json({ error: "Profil producteur requis" }, { status: 403 });
    }
    profileId = producerProfile.id;
  }

  const productions = await prisma.production.findMany({
    where: {
      ...(mine
        ? { profileId } // Si mine=true, filtrer par profileId (tous statuts)
        : {
            // Sinon, recherche publique uniquement des annonces publiées
            status: ListingStatus.PUBLISHED,
            expiresAt: { gt: new Date() },
            // Règle §9.7 : productions épuisées exclues
            quantityAvailable: { gt: 0 },
          }),
      ...(category && { category }),
      ...(region && { region }),
      ...(offerType && { offerType }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? { price: { gte: minPrice, lte: maxPrice } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      category: true,
      variety: true,
      offerType: true,
      status: true,
      quantityAvailable: true,
      quantityUnit: true,
      price: true,
      isPriceNegotiable: true,
      quality: true,
      harvestDate: true,
      availableFrom: true,
      availableUntil: true,
      region: true,
      commune: true,
      deliveryModes: true,
      publishedAt: true,
      medias: {
        select: { url: true, mediaType: true },
        take: 1,
        orderBy: { orderIndex: "asc" },
      },
      profile: {
        select: {
          id: true,
          displayName: true,
          verificationLevels: true,
          photoUrl: true,
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { publishedAt: "desc" },
  });

  const total = await prisma.production.count({
    where: {
      ...(mine
        ? { profileId }
        : {
            status: ListingStatus.PUBLISHED,
            expiresAt: { gt: new Date() },
            quantityAvailable: { gt: 0 },
          }),
      ...(category && { category }),
      ...(region && { region }),
      ...(offerType && { offerType }),
    },
  });

  return NextResponse.json({ data: productions, total, page, limit });
}
