import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, isAdmin } from "@/lib/auth/session";
import { ReportStatus } from "@/app/generated/prisma/client";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx || !isAdmin(ctx)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = (searchParams.get("status") ?? ReportStatus.PENDING) as ReportStatus;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where: { status },
      include: {
        authorProfile: { select: { id: true, displayName: true } },
        reportedProfile: { select: { id: true, displayName: true } },
        reportedField: { select: { id: true, title: true } },
        reportedProduction: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where: { status } }),
  ]);

  return NextResponse.json({ data: reports, total, page, limit });
}
