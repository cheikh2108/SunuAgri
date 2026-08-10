import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";
import { FieldOperationType, ListingStatus } from "@/app/generated/prisma/client";

const createSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  operationType: z.nativeEnum(FieldOperationType),
  region: z.string(),
  department: z.string().optional(),
  commune: z.string(),
  locality: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  areaSqm: z.number().positive(),
  areaUnit: z.string().default("ha"),
  price: z.number().positive().optional(),
  isPriceNegotiable: z.boolean().default(false),
  paymentConditions: z.string().optional(),
  rentalDurationDays: z.number().int().positive().optional(),
  availableFrom: z.string().datetime().optional(),
  soilType: z.string().optional(),
  suitableCrops: z.array(z.string()).default([]),
  waterAvailability: z.boolean().default(false),
  hasIrrigation: z.boolean().default(false),
  hasRoadAccess: z.boolean().default(false),
  hasElectricity: z.boolean().default(false),
  hasFencing: z.boolean().default(false),
  hasBuildings: z.boolean().default(false),
  specialConditions: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

// POST /api/fields — créer une annonce (brouillon)
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const ownerProfile = ctx.profiles.find((p) =>
    ["OWNER", "PRODUCER"].includes(p.type)
  );
  if (!ownerProfile) {
    return NextResponse.json({ error: "Profil propriétaire requis" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  const field = await prisma.field.create({
    data: {
      profileId: ownerProfile.id,
      title: data.title,
      description: data.description,
      operationType: data.operationType,
      status: ListingStatus.DRAFT,
      region: data.region,
      department: data.department,
      commune: data.commune,
      locality: data.locality,
      latitude: data.latitude,
      longitude: data.longitude,
      areaSqm: data.areaSqm,
      areaUnit: data.areaUnit,
      price: data.price,
      isPriceNegotiable: data.isPriceNegotiable,
      paymentConditions: data.paymentConditions,
      rentalDurationDays: data.rentalDurationDays,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
      soilType: data.soilType,
      suitableCrops: data.suitableCrops,
      waterAvailability: data.waterAvailability,
      hasIrrigation: data.hasIrrigation,
      hasRoadAccess: data.hasRoadAccess,
      hasElectricity: data.hasElectricity,
      hasFencing: data.hasFencing,
      hasBuildings: data.hasBuildings,
      specialConditions: data.specialConditions,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  return NextResponse.json(field, { status: 201 });
}

// GET /api/fields — recherche publique (pas de GPS exact)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const region = searchParams.get("region") ?? undefined;
  const commune = searchParams.get("commune") ?? undefined;
  const operationType = searchParams.get("operationType") as FieldOperationType | null;
  const minArea = searchParams.get("minArea") ? Number(searchParams.get("minArea")) : undefined;
  const maxArea = searchParams.get("maxArea") ? Number(searchParams.get("maxArea")) : undefined;
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const fields = await prisma.field.findMany({
    where: {
      status: ListingStatus.PUBLISHED,
      expiresAt: { gt: new Date() },
      ...(region && { region }),
      ...(commune && { commune }),
      ...(operationType && { operationType }),
      ...(minArea !== undefined || maxArea !== undefined
        ? { areaSqm: { gte: minArea, lte: maxArea } }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? { price: { gte: minPrice, lte: maxPrice } }
        : {}),
    },
    select: {
      id: true,
      title: true,
      operationType: true,
      status: true,
      verificationLevel: true,
      region: true,
      department: true,
      commune: true,
      locality: true,
      // GPS masqué en liste publique — cf. garde-fou métier
      areaSqm: true,
      areaUnit: true,
      price: true,
      isPriceNegotiable: true,
      soilType: true,
      suitableCrops: true,
      waterAvailability: true,
      availableFrom: true,
      publishedAt: true,
      medias: { select: { url: true, mediaType: true }, take: 1, orderBy: { orderIndex: "asc" } },
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

  const total = await prisma.field.count({
    where: {
      status: ListingStatus.PUBLISHED,
      expiresAt: { gt: new Date() },
      ...(region && { region }),
      ...(commune && { commune }),
      ...(operationType && { operationType }),
    },
  });

  return NextResponse.json({ data: fields, total, page, limit });
}
