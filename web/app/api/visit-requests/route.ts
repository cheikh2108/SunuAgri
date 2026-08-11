import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveProfile, requireProfile } from "@/lib/auth/guards";
import { handleError, ValidationError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { VisitRequestStatus, ListingStatus } from "@/app/generated/prisma/client";

const createVisitRequestSchema = z.object({
  fieldId: z.string().cuid(),
  requestedDate: z.string().datetime(),
  visitorCount: z.number().int().positive().default(1),
  message: z.string().optional(),
  needsAgentHelp: z.boolean().default(false),
});

/**
 * POST /api/visit-requests
 *
 * Créer une demande de visite pour un champ.
 * Utilise le profil actif depuis le header X-Active-Profile.
 *
 * Headers:
 * - Authorization: Bearer <token>
 * - X-Active-Profile: <profile-id>
 *
 * Body: { fieldId, requestedDate, visitorCount?, message?, needsAgentHelp? }
 */
export async function POST(req: Request) {
  try {
    // Récupérer le profil actif depuis X-Active-Profile
    // Ce guard vérifie automatiquement l'auth + que le profil appartient au user
    const visitorProfile = await getActiveProfile(req);

    // Valider le body
    const body = await req.json();
    const parsed = createVisitRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError("Données invalides", parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;

    // Vérifier que le champ existe et est publié
    const field = await prisma.field.findUnique({
      where: { id: data.fieldId },
      include: {
        profile: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!field) {
      throw new NotFoundError("Champ introuvable");
    }

    if (field.status !== ListingStatus.PUBLISHED) {
      throw new ValidationError("Ce champ n'est pas disponible pour les visites");
    }

    // Ne pas permettre au propriétaire de demander une visite de son propre champ
    if (field.profileId === visitorProfile.id) {
      throw new ForbiddenError("Vous ne pouvez pas demander une visite de votre propre champ");
    }

    // Vérifier qu'il n'y a pas déjà une demande en cours
    const existingRequest = await prisma.visitRequest.findFirst({
      where: {
        fieldId: data.fieldId,
        visitorProfileId: visitorProfile.id,
        status: {
          in: [VisitRequestStatus.REQUESTED, VisitRequestStatus.ACCEPTED],
        },
      },
    });

    if (existingRequest) {
      throw new ValidationError(
        "Vous avez déjà une demande de visite en cours pour ce champ"
      );
    }

    // Créer la demande de visite
    const visitRequest = await prisma.visitRequest.create({
      data: {
        fieldId: data.fieldId,
        visitorProfileId: visitorProfile.id,
        requestedDate: new Date(data.requestedDate),
        visitorCount: data.visitorCount,
        message: data.message,
        needsAgentHelp: data.needsAgentHelp,
        status: VisitRequestStatus.REQUESTED,
      },
      include: {
        field: {
          select: {
            id: true,
            title: true,
            region: true,
            commune: true,
          },
        },
        visitorProfile: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
          },
        },
      },
    });

    // TODO: Envoyer une notification au propriétaire

    return Response.json(visitRequest, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/visit-requests
 *
 * Récupérer les demandes de visite du profil actif.
 * Retourne :
 * - Les demandes ENVOYÉES si c'est un profil visiteur
 * - Les demandes REÇUES si c'est un profil propriétaire
 *
 * Query params:
 * - type: "sent" | "received" (default: "sent")
 * - status?: VisitRequestStatus
 */
export async function GET(req: Request) {
  try {
    const profile = await getActiveProfile(req);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "sent";
    const status = searchParams.get("status") as VisitRequestStatus | null;

    if (type === "sent") {
      // Demandes envoyées par ce profil
      const requests = await prisma.visitRequest.findMany({
        where: {
          visitorProfileId: profile.id,
          ...(status && { status }),
        },
        include: {
          field: {
            select: {
              id: true,
              title: true,
              region: true,
              commune: true,
              // Ne pas inclure latitude/longitude ici
              // Seul l'endpoint détail le fera si la demande est ACCEPTED
              profile: {
                select: {
                  id: true,
                  displayName: true,
                  photoUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return Response.json({ data: requests });
    } else {
      // Demandes reçues pour les champs de ce profil
      const requests = await prisma.visitRequest.findMany({
        where: {
          field: {
            profileId: profile.id,
          },
          ...(status && { status }),
        },
        include: {
          visitorProfile: {
            select: {
              id: true,
              displayName: true,
              photoUrl: true,
              verificationLevels: true,
            },
          },
          field: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return Response.json({ data: requests });
    }
  } catch (error) {
    return handleError(error);
  }
}
