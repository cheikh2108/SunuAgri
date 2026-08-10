import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";
import { ListingStatus, OfferStatus, VisitRequestStatus } from "@/app/generated/prisma/client";

// GET /api/dashboard — tableau de bord de l'utilisateur connecté
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profileIds = ctx.profiles.map((p) => p.id);

  const [
    fields,
    productions,
    visitRequestsReceived,
    visitRequestsSent,
    offersReceived,
    offersSent,
    purchaseRequestsReceived,
    purchaseRequestsSent,
    unreadMessages,
    unreadNotifications,
    favoritesCount,
  ] = await Promise.all([
    prisma.field.groupBy({
      by: ["status"],
      where: { profileId: { in: profileIds } },
      _count: true,
    }),
    prisma.production.groupBy({
      by: ["status"],
      where: { profileId: { in: profileIds } },
      _count: true,
    }),
    prisma.visitRequest.count({
      where: { field: { profileId: { in: profileIds } }, status: VisitRequestStatus.REQUESTED },
    }),
    prisma.visitRequest.count({
      where: { visitorProfileId: { in: profileIds } },
    }),
    prisma.offer.count({
      where: { targetProfileId: { in: profileIds }, status: OfferStatus.PENDING },
    }),
    prisma.offer.count({
      where: { senderProfileId: { in: profileIds } },
    }),
    prisma.purchaseRequest.count({
      where: {
        production: { profileId: { in: profileIds } },
        status: OfferStatus.PENDING,
      },
    }),
    prisma.purchaseRequest.count({
      where: { buyerProfileId: { in: profileIds } },
    }),
    prisma.message.count({
      where: {
        conversation: { participants: { some: { profileId: { in: profileIds } } } },
        senderProfileId: { notIn: profileIds },
        isRead: false,
      },
    }),
    prisma.notification.count({
      where: { profileId: { in: profileIds }, isRead: false },
    }),
    prisma.favorite.count({
      where: { profileId: { in: profileIds } },
    }),
  ]);

  const fieldsByStatus = Object.fromEntries(
    fields.map((f) => [f.status, f._count])
  );
  const productionsByStatus = Object.fromEntries(
    productions.map((p) => [p.status, p._count])
  );

  return NextResponse.json({
    fields: {
      active: fieldsByStatus[ListingStatus.PUBLISHED] ?? 0,
      pending: fieldsByStatus[ListingStatus.PENDING_VALIDATION] ?? 0,
      draft: fieldsByStatus[ListingStatus.DRAFT] ?? 0,
      expired: fieldsByStatus[ListingStatus.EXPIRED] ?? 0,
    },
    productions: {
      active: productionsByStatus[ListingStatus.PUBLISHED] ?? 0,
      pending: productionsByStatus[ListingStatus.PENDING_VALIDATION] ?? 0,
      draft: productionsByStatus[ListingStatus.DRAFT] ?? 0,
    },
    requests: {
      visitRequestsReceived,
      visitRequestsSent,
      offersReceived,
      offersSent,
      purchaseRequestsReceived,
      purchaseRequestsSent,
    },
    inbox: {
      unreadMessages,
      unreadNotifications,
    },
    favoritesCount,
  });
}
