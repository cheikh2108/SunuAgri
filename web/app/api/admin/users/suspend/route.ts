import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, ValidationError, NotFoundError } from "@/lib/errors";

const suspendSchema = z.object({
  userId: z.string().cuid(),
  reason: z.string().min(10, "La raison doit contenir au moins 10 caractères"),
});

/**
 * POST /api/admin/users/suspend
 *
 * Suspend un compte utilisateur.
 * Requiert le rôle ADMIN ou SUPER_ADMIN.
 *
 * Headers: Authorization: Bearer <token>
 * Body: { userId: string, reason: string }
 */
export async function POST(req: Request) {
  try {
    // Vérifier que l'utilisateur est admin
    const admin = await requireAdmin(req);

    // Valider le body
    const body = await req.json();
    const parsed = suspendSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError("Données invalides", parsed.error.flatten().fieldErrors);
    }

    const { userId, reason } = parsed.data;

    // Vérifier que le user existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("Utilisateur introuvable");
    }

    // Ne pas permettre de suspendre un SUPER_ADMIN (protection)
    if (user.systemRole === "SUPER_ADMIN") {
      throw new ValidationError("Impossible de suspendre un super administrateur");
    }

    // Suspendre le compte
    await prisma.$transaction([
      // Marquer le user comme suspendu
      prisma.user.update({
        where: { id: userId },
        data: {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendReason: reason,
        },
      }),

      // Révoquer toutes ses sessions actives
      prisma.session.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return Response.json({
      success: true,
      message: "Compte suspendu avec succès",
      suspendedBy: admin.id,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/admin/users/suspend
 *
 * Lève la suspension d'un compte.
 */
export async function DELETE(req: Request) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      throw new ValidationError("userId requis en query param");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("Utilisateur introuvable");
    }

    // Lever la suspension
    await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspendedAt: null,
        suspendReason: null,
      },
    });

    return Response.json({
      success: true,
      message: "Suspension levée avec succès",
    });
  } catch (error) {
    return handleError(error);
  }
}
