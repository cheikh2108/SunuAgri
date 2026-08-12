import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";

const createReviewSchema = z.object({
  targetProfileId: z.string().cuid(),
  reliability: z.number().int().min(1).max(5),
  conformity: z.number().int().min(1).max(5),
  punctuality: z.number().int().min(1).max(5),
  communication: z.number().int().min(1).max(5),
  commitment: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// GET /api/reviews?targetProfileId=xxx - récupérer les avis d'un profil
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const targetProfileId = searchParams.get("targetProfileId");

  if (!targetProfileId) {
    return NextResponse.json({ error: "targetProfileId requis" }, { status: 400 });
  }

  try {
    const reviews = await prisma.review.findMany({
      where: {
        targetProfileId,
        isModerated: false, // Exclure les avis modérés/supprimés
      },
      include: {
        authorProfile: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Échec de récupération des avis" }, { status: 500 });
  }
}

// POST /api/reviews - créer un avis
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const authorProfile = ctx.profiles[0];
  if (!authorProfile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const validation = createReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { targetProfileId, reliability, conformity, punctuality, communication, commitment, comment } = validation.data;

    // Vérifier qu'on ne s'auto-évalue pas
    if (authorProfile.id === targetProfileId) {
      return NextResponse.json({ error: "Impossible de s'auto-évaluer" }, { status: 400 });
    }

    // Vérifier que le profil cible existe
    const targetProfile = await prisma.profile.findUnique({
      where: { id: targetProfileId },
    });

    if (!targetProfile) {
      return NextResponse.json({ error: "Profil cible introuvable" }, { status: 404 });
    }

    // Vérifier qu'on n'a pas déjà évalué ce profil (optionnel - peut être retiré si on autorise plusieurs avis)
    const existingReview = await prisma.review.findFirst({
      where: {
        authorProfileId: authorProfile.id,
        targetProfileId,
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: "Vous avez déjà évalué ce profil" }, { status: 409 });
    }

    // Créer l'avis
    const review = await prisma.review.create({
      data: {
        authorProfileId: authorProfile.id,
        targetProfileId,
        reliability,
        conformity,
        punctuality,
        communication,
        commitment,
        comment,
        publishedAt: new Date(),
      },
      include: {
        authorProfile: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Échec de création de l'avis" }, { status: 500 });
  }
}
