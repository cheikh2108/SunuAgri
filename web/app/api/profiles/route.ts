import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, ApiError } from "@/lib/auth/profile";
import { createProfileSchema } from "@/lib/validations/profile";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * GET /api/profiles
 * Liste tous les profils du user connecté
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    const profiles = await prisma.profile.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
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
      profiles,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/profiles
 * Crée un nouveau profil pour le user connecté
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    const body = await req.json().catch(() => null);
    const parsed = createProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Vérifier qu'un profil de ce type n'existe pas déjà (contrainte @@unique([userId, type]))
    const existingProfile = await prisma.profile.findFirst({
      where: {
        userId: user.id,
        type: data.type,
      },
    });

    if (existingProfile) {
      return NextResponse.json(
        {
          error: "PROFILE_ALREADY_EXISTS",
          message: `Vous avez déjà un profil de type ${data.type}`,
        },
        { status: 409 }
      );
    }

    // Vérifier si c'est le premier profil (pour mettre à jour hasCompletedOnboarding)
    const isFirstProfile = user.profiles.length === 0;

    // Créer le profil
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        type: data.type,
        displayName: data.displayName,
        photoUrl: data.photoUrl ?? null,
        bio: data.bio ?? null,
        region: data.region ?? null,
        department: data.department ?? null,
        commune: data.commune ?? null,
        locality: data.locality ?? null,
        phoneVisible: data.phoneVisible ?? false,
        activityArea: ("activityArea" in data ? data.activityArea : null) ?? null,
        verificationLevels: ["NONE"],
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
        createdAt: true,
        updatedAt: true,
      },
    });

    // Si c'est le premier profil, marquer l'onboarding comme complété
    if (isFirstProfile) {
      await prisma.user.update({
        where: { id: user.id },
        data: { hasCompletedOnboarding: true },
      });
    }

    return NextResponse.json(
      {
        profile,
        message: "Profil créé avec succès",
        hasCompletedOnboarding: true,
      },
      { status: 201 }
    );
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
    // P2002 = Unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "DUPLICATE_ENTRY",
          message: "Un profil de ce type existe déjà",
        },
        { status: 409 }
      );
    }
  }

  return NextResponse.json(
    { error: "INTERNAL_ERROR", message: "Une erreur est survenue" },
    { status: 500 }
  );
}
