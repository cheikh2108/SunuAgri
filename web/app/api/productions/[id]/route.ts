import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext, isAdmin } from "@/lib/auth/session";
import { ListingStatus, ProductionOfferType } from "@/app/generated/prisma/client";

// GET /api/productions/[id] — détail d'une production
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext(req);

  const production = await prisma.production.findUnique({
    where: { id },
    include: {
      medias: { orderBy: { orderIndex: "asc" } },
      profile: {
        select: {
          id: true,
          displayName: true,
          verificationLevels: true,
          photoUrl: true,
          region: true,
          commune: true,
          avgResponseHours: true,
        },
      },
    },
  });

  if (!production) {
    return NextResponse.json({ error: "Production introuvable" }, { status: 404 });
  }

  // Annonces non publiées : visibles uniquement par le producteur ou un admin
  if (production.status !== ListingStatus.PUBLISHED) {
    if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const isOwner = ctx.profiles.some((p) => p.id === production.profileId);
    if (!isOwner && !isAdmin(ctx)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  return NextResponse.json(production);
}

const patchSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  category: z.string().optional(),
  variety: z.string().optional(),
  offerType: z.nativeEnum(ProductionOfferType).optional(),
  quantityAvailable: z.number().min(0).optional(),
  quantityUnit: z.string().optional(),
  minOrderQuantity: z.number().positive().optional(),
  price: z.number().positive().optional(),
  isPriceNegotiable: z.boolean().optional(),
  quality: z.string().optional(),
  caliber: z.string().optional(),
  productionMode: z.string().optional(),
  harvestDate: z.string().datetime().optional(),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
  region: z.string().optional(),
  department: z.string().optional(),
  commune: z.string().optional(),
  storageConditions: z.string().optional(),
  deliveryModes: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
  // Actions de statut et quantité
  action: z.enum(["submit", "suspend", "archive", "mark_exhausted", "mark_sold"]).optional(),
});

// PATCH /api/productions/[id] — modifier, gérer quantités ou changer le statut
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const production = await prisma.production.findUnique({ where: { id } });
  if (!production) return NextResponse.json({ error: "Production introuvable" }, { status: 404 });

  const isOwner = ctx.profiles.some((p) => p.id === production.profileId);
  if (!isOwner && !isAdmin(ctx)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { action, harvestDate, availableFrom, availableUntil, expiresAt, ...rest } = parsed.data;

  let statusUpdate: Partial<{ status: ListingStatus; quantityAvailable: number }> = {};

  if (action === "submit") {
    const target = { ...production, ...rest };
    if (!target.name || !target.category || !target.region) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (nom, catégorie, région)" },
        { status: 422 }
      );
    }
    statusUpdate = { status: ListingStatus.PENDING_VALIDATION };
  } else if (action === "suspend") {
    statusUpdate = { status: ListingStatus.SUSPENDED };
  } else if (action === "archive") {
    statusUpdate = { status: ListingStatus.ARCHIVED };
  } else if (action === "mark_exhausted") {
    // Règle §9.7 : production épuisée → quantité à zéro, n'apparaît plus en recherche
    statusUpdate = { quantityAvailable: 0 };
  } else if (action === "mark_sold") {
    statusUpdate = { status: ListingStatus.ARCHIVED, quantityAvailable: 0 };
  }

  const updated = await prisma.production.update({
    where: { id },
    data: {
      ...rest,
      ...(harvestDate ? { harvestDate: new Date(harvestDate) } : {}),
      ...(availableFrom ? { availableFrom: new Date(availableFrom) } : {}),
      ...(availableUntil ? { availableUntil: new Date(availableUntil) } : {}),
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
      ...statusUpdate,
    },
  });

  return NextResponse.json(updated);
}
