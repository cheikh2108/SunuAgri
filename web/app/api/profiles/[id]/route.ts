import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProfileById, ApiError } from "@/lib/auth/profile";
import { updateProfileSchema } from "@/lib/validations/profile";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * GET /api/profiles/[id]
 * Récupère les détails d'un profil spécifique
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { profile } = await getProfileById(req, id);

    return NextResponse.json({ profile });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/profiles/[id]
 * Met à jour un profil existant
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, profile } = await getProfileById(req, id);

    const body = await req.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Vérifier les contraintes métier selon le type de profil
    // Par exemple, un OWNER doit toujours avoir region et commune
    if (profile.type === "OWNER") {
      if (data.region === null || data.commune === null) {
        return NextResponse.json(
          {
            error: "INVALID_DATA",
            message: "Un propriétaire doit avoir une région et une commune",
          },
          { status: 400 }
        );
      }
    }

    // Vérifier qu'un PRODUCER garde son activityArea
    if (profile.type === "PRODUCER") {
      if (data.activityArea === null) {
        return NextResponse.json(
          {
            error: "INVALID_DATA",
            message: "Un producteur doit avoir un domaine d'activité",
          },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le profil
    const updatedProfile = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.region !== undefined && { region: data.region }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.commune !== undefined && { commune: data.commune }),
        ...(data.locality !== undefined && { locality: data.locality }),
        ...(data.phoneVisible !== undefined && { phoneVisible: data.phoneVisible }),
        ...(data.activityArea !== undefined && { activityArea: data.activityArea }),
      },
      select: {
        id: true,
        type: true,
        displayName: true,
        photoUrl: true,
        bio: true,
        region: true,
        department: true,
        commune: true,
        locality: true,
        phoneVisible: true,
        activityArea: true,
        verificationLevels: true,
        avgResponseHours: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      profile: updatedProfile,
      message: "Profil mis à jour avec succès",
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/profiles/[id]
 * Soft delete d'un profil (met isActive à false)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, profile } = await getProfileById(req, id);

    // Vérifier qu'il reste au moins un autre profil actif
    const activeProfilesCount = user.profiles.filter((p) => p.isActive).length;

    if (activeProfilesCount <= 1) {
      return NextResponse.json(
        {
          error: "LAST_PROFILE",
          message: "Vous devez conserver au moins un profil actif",
        },
        { status: 400 }
      );
    }

    // Soft delete : on met isActive à false au lieu de supprimer
    await prisma.profile.update({
      where: { id: profile.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Profil désactivé avec succès",
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Gestionnaire d'erreurs centralisé
 */
function handleError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.status }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Profil introuvable" },
        { status: 404 }
      );
    }
  }

  return NextResponse.json(
    { error: "INTERNAL_ERROR", message: "Une erreur est survenue" },
    { status: 500 }
  );
}
