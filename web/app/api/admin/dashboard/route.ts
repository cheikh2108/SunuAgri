import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, isAdmin } from "@/lib/auth/session";
import { ListingStatus, ReportStatus } from "@/app/generated/prisma/client";

// GET /api/admin/dashboard — tableau de bord administrateur
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx || !isAdmin(ctx)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const [
    totalUsers,
    suspendedUsers,
    totalFields,
    pendingFields,
    publishedFields,
    totalProductions,
    pendingProductions,
    publishedProductions,
    totalVisitRequests,
    totalOffers,
    totalPurchaseRequests,
    pendingReports,
    fieldsByRegion,
    productionsByCategory,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isSuspended: true } }),
    prisma.field.count(),
    prisma.field.count({ where: { status: ListingStatus.PENDING_VALIDATION } }),
    prisma.field.count({ where: { status: ListingStatus.PUBLISHED } }),
    prisma.production.count(),
    prisma.production.count({ where: { status: ListingStatus.PENDING_VALIDATION } }),
    prisma.production.count({ where: { status: ListingStatus.PUBLISHED } }),
    prisma.visitRequest.count(),
    prisma.offer.count(),
    prisma.purchaseRequest.count(),
    prisma.report.count({ where: { status: ReportStatus.PENDING } }),
    prisma.field.groupBy({
      by: ["region"],
      _count: true,
      where: { status: ListingStatus.PUBLISHED },
      orderBy: { _count: { region: "desc" } },
      take: 10,
    }),
    prisma.production.groupBy({
      by: ["category"],
      _count: true,
      where: { status: ListingStatus.PUBLISHED },
      orderBy: { _count: { category: "desc" } },
      take: 10,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        phone: true,
        email: true,
        createdAt: true,
        profiles: { select: { type: true, displayName: true }, take: 1 },
      },
    }),
  ]);

  return NextResponse.json({
    users: { total: totalUsers, suspended: suspendedUsers },
    fields: { total: totalFields, pending: pendingFields, published: publishedFields },
    productions: { total: totalProductions, pending: pendingProductions, published: publishedProductions },
    activity: {
      visitRequests: totalVisitRequests,
      offers: totalOffers,
      purchaseRequests: totalPurchaseRequests,
    },
    moderation: { pendingReports },
    geo: { fieldsByRegion: fieldsByRegion.map((r) => ({ region: r.region, count: r._count })) },
    categories: productionsByCategory.map((c) => ({ category: c.category, count: c._count })),
    recentUsers,
  });
}
