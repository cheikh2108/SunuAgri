import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext, isAdmin } from "@/lib/auth/session";
import {
  FieldOperationType,
  ListingStatus,
  VisitRequestStatus,
} from "@/app/generated/prisma/client";

// GET /api/fields/[id] — détail d'un champ
// GPS masqué sauf si une demande de visite a été acceptée pour le demandeur (garde-fou §5.1)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext(req);

  const field = await prisma.field.findUnique({
    where: { id },
    include: {
      medias: { orderBy: { orderIndex: "asc" } },
      documents: true,
      profile: {
        select: {
          id: true,
          displayName: true,
          verificationLevels: true,
          photoUrl: true,
          region: true,
          commune: true,
          avgResponseHours: true,
          _count: {
            select: {
              fields: true,
            },
          },
        },
      },
    },
  });

  if (!field) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  // Annonces non publiées : visibles uniquement par le propriétaire ou un admin
  if (field.status !== ListingStatus.PUBLISHED) {
    if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const isOwner = ctx.profiles.some((p) => p.id === field.profileId);
    if (!isOwner && !isAdmin(ctx)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  // Vérifier si le GPS peut être révélé
  let revealGps = false;

  if (ctx) {
    const isOwner = ctx.profiles.some((p) => p.id === field.profileId);
    if (isOwner || isAdmin(ctx)) {
      revealGps = true;
    } else {
      // GPS révélé uniquement si une demande de visite acceptée existe pour ce profil
      const visitorProfileIds = ctx.profiles.map((p) => p.id);
      const acceptedVisit = await prisma.visitRequest.findFirst({
        where: {
          fieldId: id,
          visitorProfileId: { in: visitorProfileIds },
          status: VisitRequestStatus.ACCEPTED,
        },
      });
      revealGps = !!acceptedVisit;
    }
  }

  return NextResponse.json({
    ...field,
    latitude: revealGps ? field.latitude : null,
    longitude: revealGps ? field.longitude : null,
  });
}

const patchSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).optional(),
  operationType: z.nativeEnum(FieldOperationType).optional(),
  region: z.string().optional(),
  department: z.string().optional(),
  commune: z.string().optional(),
  locality: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  areaSqm: z.number().positive().optional(),
  areaUnit: z.string().optional(),
  price: z.number().positive().optional(),
  isPriceNegotiable: z.boolean().optional(),
  paymentConditions: z.string().optional(),
  rentalDurationDays: z.number().int().positive().optional(),
  availableFrom: z.string().datetime().optional(),
  soilType: z.string().optional(),
  suitableCrops: z.array(z.string()).optional(),
  waterAvailability: z.boolean().optional(),
  hasIrrigation: z.boolean().optional(),
  hasRoadAccess: z.boolean().optional(),
  hasElectricity: z.boolean().optional(),
  hasFencing: z.boolean().optional(),
  hasBuildings: z.boolean().optional(),
  specialConditions: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  // Actions de statut
  action: z.enum(["submit", "suspend", "archive"]).optional(),
});

// PATCH /api/fields/[id] — modifier ou changer le statut d'une annonce
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const field = await prisma.field.findUnique({ where: { id } });
  if (!field) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });

  const isOwner = ctx.profiles.some((p) => p.id === field.profileId);
  if (!isOwner && !isAdmin(ctx)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { action, availableFrom, expiresAt, ...rest } = parsed.data;

  // Transition de statut — seul le propriétaire peut soumettre
  let statusUpdate: Partial<{ status: ListingStatus; publishedAt: Date }> = {};

  if (action === "submit") {
    // Règle §9.1 : vérifier les champs obligatoires avant soumission
    const target = { ...field, ...rest };
    if (!target.title || !target.description || !target.operationType || !target.commune) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (titre, description, type d'opération, commune)" },
        { status: 422 }
      );
    }
    statusUpdate = { status: ListingStatus.PENDING_VALIDATION };
  } else if (action === "suspend" && (isOwner || isAdmin(ctx))) {
    statusUpdate = { status: ListingStatus.SUSPENDED };
  } else if (action === "archive" && (isOwner || isAdmin(ctx))) {
    statusUpdate = { status: ListingStatus.ARCHIVED };
  }

  const updated = await prisma.field.update({
    where: { id },
    data: {
      ...rest,
      ...(availableFrom ? { availableFrom: new Date(availableFrom) } : {}),
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
      ...statusUpdate,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/fields/[id] — supprimer une annonce (soft delete via statut ARCHIVED)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const field = await prisma.field.findUnique({ where: { id } });
  if (!field) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });

  const isOwner = ctx.profiles.some((p) => p.id === field.profileId);
  if (!isOwner && !isAdmin(ctx)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Soft delete via statut ARCHIVED
  await prisma.field.update({
    where: { id },
    data: { status: ListingStatus.ARCHIVED },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
