/**
 * EXEMPLE DE MIGRATION vers le nouveau système de guards
 *
 * Ce fichier montre comment migrer la route existante vers le nouveau système.
 * Comparer avec route.ts pour voir les différences.
 *
 * Avantages du nouveau système :
 * - Code plus concis
 * - Erreurs typées automatiquement
 * - Pas de vérifications manuelles if (!ctx)
 * - Handler d'erreur centralisé
 */

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOptional } from "@/lib/auth/getCurrentUser";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import {
  FieldOperationType,
  ListingStatus,
  VisitRequestStatus,
} from "@/app/generated/prisma/client";

/**
 * GET /api/fields/[id]
 *
 * Récupère les détails d'un champ.
 * GPS masqué sauf si une demande de visite a été ACCEPTÉE (garde-fou §5).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fieldId } = await params;

    // Authentification optionnelle (route publique)
    const currentUser = await getCurrentUserOptional(req);

    // Récupérer le champ
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
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
          },
        },
      },
    });

    if (!field) {
      throw new NotFoundError("Annonce introuvable");
    }

    // Annonces non publiées : visibles uniquement par le propriétaire ou admin
    if (field.status !== ListingStatus.PUBLISHED) {
      if (!currentUser) {
        throw new ForbiddenError("Cette annonce n'est pas accessible");
      }

      const isOwner = currentUser.profiles.some((p) => p.id === field.profileId);
      const isAdminUser = ["ADMIN", "SUPER_ADMIN"].includes(currentUser.systemRole);

      if (!isOwner && !isAdminUser) {
        throw new ForbiddenError("Accès refusé");
      }
    }

    // Vérifier si le GPS peut être révélé (garde-fou §5)
    let revealGps = false;

    if (currentUser) {
      const isOwner = currentUser.profiles.some((p) => p.id === field.profileId);
      const isAdminUser = ["ADMIN", "SUPER_ADMIN"].includes(currentUser.systemRole);

      if (isOwner || isAdminUser) {
        revealGps = true;
      } else {
        // GPS révélé uniquement si une demande de visite ACCEPTÉE existe
        const visitorProfileIds = currentUser.profiles.map((p) => p.id);
        const acceptedVisit = await prisma.visitRequest.findFirst({
          where: {
            fieldId,
            visitorProfileId: { in: visitorProfileIds },
            status: VisitRequestStatus.ACCEPTED,
          },
        });
        revealGps = !!acceptedVisit;
      }
    }

    return Response.json({
      ...field,
      latitude: revealGps ? field.latitude : null,
      longitude: revealGps ? field.longitude : null,
      gpsAccessGranted: revealGps,
    });
  } catch (error) {
    return handleError(error);
  }
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
  action: z.enum(["submit", "suspend", "archive"]).optional(),
});

/**
 * PATCH /api/fields/[id]
 *
 * Modifier ou changer le statut d'une annonce.
 * Seul le propriétaire ou un admin peut modifier.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fieldId } = await params;

    // Auth obligatoire
    const currentUser = await getCurrentUserOptional(req);
    if (!currentUser) {
      throw new ForbiddenError("Authentification requise");
    }

    // Récupérer le champ
    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) {
      throw new NotFoundError("Annonce introuvable");
    }

    // Vérifier les permissions
    const isOwner = currentUser.profiles.some((p) => p.id === field.profileId);
    const isAdminUser = ["ADMIN", "SUPER_ADMIN"].includes(currentUser.systemRole);

    if (!isOwner && !isAdminUser) {
      throw new ForbiddenError("Accès refusé");
    }

    // Valider le body
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError("Données invalides", parsed.error.flatten().fieldErrors);
    }

    const { action, availableFrom, expiresAt, ...rest } = parsed.data;

    // Transition de statut
    let statusUpdate: Partial<{ status: ListingStatus; publishedAt: Date }> = {};

    if (action === "submit") {
      // Règle §9.1 : vérifier les champs obligatoires avant soumission
      const target = { ...field, ...rest };
      if (!target.title || !target.description || !target.operationType || !target.commune) {
        throw new ValidationError(
          "Champs obligatoires manquants (titre, description, type d'opération, commune)"
        );
      }
      statusUpdate = { status: ListingStatus.PENDING_VALIDATION };
    } else if (action === "suspend" && (isOwner || isAdminUser)) {
      statusUpdate = { status: ListingStatus.SUSPENDED };
    } else if (action === "archive" && (isOwner || isAdminUser)) {
      statusUpdate = { status: ListingStatus.ARCHIVED };
    }

    // Appliquer les modifications
    const updated = await prisma.field.update({
      where: { id: fieldId },
      data: {
        ...rest,
        ...(availableFrom ? { availableFrom: new Date(availableFrom) } : {}),
        ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
        ...statusUpdate,
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/fields/[id]
 *
 * Archiver un champ (soft delete).
 * Seul le propriétaire peut archiver son champ.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fieldId } = await params;

    const currentUser = await getCurrentUserOptional(req);
    if (!currentUser) {
      throw new ForbiddenError("Authentification requise");
    }

    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) {
      throw new NotFoundError("Annonce introuvable");
    }

    const isOwner = currentUser.profiles.some((p) => p.id === field.profileId);
    if (!isOwner) {
      throw new ForbiddenError("Seul le propriétaire peut archiver cette annonce");
    }

    await prisma.field.update({
      where: { id: fieldId },
      data: { status: ListingStatus.ARCHIVED },
    });

    return Response.json({ success: true, message: "Annonce archivée" });
  } catch (error) {
    return handleError(error);
  }
}
