import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/profiles/:id — détails publics d'un profil
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profile = await prisma.profile.findUnique({
    where: { id, isActive: true },
    select: {
      id: true,
      type: true,
      displayName: true,
      bio: true,
      photoUrl: true,
      region: true,
      commune: true,
      verificationLevels: true,
      createdAt: true,
      _count: {
        select: {
          fields: true,
          productions: true,
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  // Récupérer les avis pour ce profil
  const reviews = await prisma.review.findMany({
    where: { targetProfileId: id },
    select: {
      id: true,
      reliability: true,
      conformity: true,
      punctuality: true,
      communication: true,
      commitment: true,
      comment: true,
      createdAt: true,
      reviewerProfile: {
        select: {
          id: true,
          displayName: true,
          photoUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Calculer les stats d'avis
  const reviewCount = reviews.length;
  let averageRating = 0;
  let averages = {
    reliability: 0,
    conformity: 0,
    punctuality: 0,
    communication: 0,
    commitment: 0,
  };

  if (reviewCount > 0) {
    const totals = reviews.reduce(
      (acc, r) => ({
        reliability: acc.reliability + r.reliability,
        conformity: acc.conformity + r.conformity,
        punctuality: acc.punctuality + r.punctuality,
        communication: acc.communication + r.communication,
        commitment: acc.commitment + r.commitment,
      }),
      { reliability: 0, conformity: 0, punctuality: 0, communication: 0, commitment: 0 }
    );

    averages = {
      reliability: parseFloat((totals.reliability / reviewCount).toFixed(1)),
      conformity: parseFloat((totals.conformity / reviewCount).toFixed(1)),
      punctuality: parseFloat((totals.punctuality / reviewCount).toFixed(1)),
      communication: parseFloat((totals.communication / reviewCount).toFixed(1)),
      commitment: parseFloat((totals.commitment / reviewCount).toFixed(1)),
    };

    averageRating = parseFloat(
      (
        (averages.reliability +
          averages.conformity +
          averages.punctuality +
          averages.communication +
          averages.commitment) /
        5
      ).toFixed(1)
    );
  }

  return NextResponse.json({
    ...profile,
    reviews: {
      count: reviewCount,
      averageRating,
      averages,
      items: reviews,
    },
  });
}
