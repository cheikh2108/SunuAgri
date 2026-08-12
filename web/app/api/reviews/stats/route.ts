import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reviews/stats?profileId=xxx - statistiques des avis d'un profil
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const profileId = searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.json({ error: "profileId requis" }, { status: 400 });
  }

  try {
    // Récupérer tous les avis du profil
    const reviews = await prisma.review.findMany({
      where: {
        targetProfileId: profileId,
        isModerated: false,
      },
      select: {
        reliability: true,
        conformity: true,
        punctuality: true,
        communication: true,
        commitment: true,
      },
    });

    const count = reviews.length;

    if (count === 0) {
      return NextResponse.json({
        count: 0,
        averageRating: 0,
        reliability: 0,
        conformity: 0,
        punctuality: 0,
        communication: 0,
        commitment: 0,
      });
    }

    // Calculer les moyennes
    const totals = reviews.reduce(
      (acc, review) => ({
        reliability: acc.reliability + review.reliability,
        conformity: acc.conformity + review.conformity,
        punctuality: acc.punctuality + review.punctuality,
        communication: acc.communication + review.communication,
        commitment: acc.commitment + review.commitment,
      }),
      { reliability: 0, conformity: 0, punctuality: 0, communication: 0, commitment: 0 }
    );

    const averages = {
      reliability: totals.reliability / count,
      conformity: totals.conformity / count,
      punctuality: totals.punctuality / count,
      communication: totals.communication / count,
      commitment: totals.commitment / count,
    };

    // Moyenne générale
    const averageRating =
      (averages.reliability + averages.conformity + averages.punctuality + averages.communication + averages.commitment) / 5;

    return NextResponse.json({
      count,
      averageRating: Math.round(averageRating * 10) / 10, // Arrondi à 1 décimale
      reliability: Math.round(averages.reliability * 10) / 10,
      conformity: Math.round(averages.conformity * 10) / 10,
      punctuality: Math.round(averages.punctuality * 10) / 10,
      communication: Math.round(averages.communication * 10) / 10,
      commitment: Math.round(averages.commitment * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching review stats:", error);
    return NextResponse.json({ error: "Échec de récupération des statistiques" }, { status: 500 });
  }
}
