/**
 * EXEMPLE D'UTILISATION DES GUARDS
 *
 * Ce fichier montre comment utiliser le nouveau système d'auth dans une route API.
 * Renommer en route.ts pour l'activer (remplacera l'ancienne version).
 */

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/auth/guards";
import { handleError, ValidationError } from "@/lib/errors";
import { FieldOperationType, ListingStatus } from "@/app/generated/prisma/client";

const createFieldSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères").max(200),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères"),
  operationType: z.nativeEnum(FieldOperationType),
  region: z.string(),
  department: z.string().optional(),
  commune: z.string(),
  locality: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  areaSqm: z.number().positive("La superficie doit être positive"),
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

/**
 * POST /api/fields — Créer une annonce foncière (brouillon)
 *
 * Requiert :
 * - Authentification (JWT)
 * - Profil OWNER ou PRODUCER
 * - Headers : Authorization: Bearer <token>
 */
export async function POST(req: Request) {
  try {
    // 1. Vérifier que l'utilisateur a un profil OWNER ou PRODUCER
    // Note : requireProfile vérifie automatiquement l'authentification
    const ownerProfile = await requireProfile(req, "OWNER");

    // Si l'utilisateur n'a pas de profil OWNER, essayer PRODUCER
    // (Alternative : permettre aux deux de créer des annonces)

    // 2. Parser et valider le body
    const body = await req.json();
    const parsed = createFieldSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      throw new ValidationError("Données invalides", errors);
    }

    const data = parsed.data;

    // 3. Créer l'annonce en brouillon
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
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
        soilType: data.soilType,
        suitableCrops: data.suitableCrops,
        waterAvailability: data.waterAvailability,
        hasIrrigation: data.hasIrrigation,
        hasRoadAccess: data.hasRoadAccess,
        hasElectricity: data.hasElectricity,
        hasFencing: data.hasFencing,
        hasBuildings: data.hasBuildings,
        specialConditions: data.specialConditions,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    return Response.json(field, { status: 201 });

  } catch (error) {
    // handleError convertit automatiquement les erreurs en Response JSON
    // - AuthError → 401
    // - ForbiddenError → 403
    // - ValidationError → 400
    // - Autres erreurs → 500
    return handleError(error);
  }
}

/**
 * GET /api/fields — Recherche publique d'annonces
 *
 * Pas d'authentification requise.
 * GPS exact masqué (garde-fou métier §5).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

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
        // GPS masqué en liste publique — cf. garde-fou métier §5
        // latitude et longitude ne sont PAS inclus ici
        areaSqm: true,
        areaUnit: true,
        price: true,
        isPriceNegotiable: true,
        soilType: true,
        suitableCrops: true,
        waterAvailability: true,
        availableFrom: true,
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

    const total = await prisma.field.count({
      where: {
        status: ListingStatus.PUBLISHED,
        expiresAt: { gt: new Date() },
        ...(region && { region }),
        ...(commune && { commune }),
        ...(operationType && { operationType }),
      },
    });

    return Response.json({ data: fields, total, page, limit });

  } catch (error) {
    return handleError(error);
  }
}
