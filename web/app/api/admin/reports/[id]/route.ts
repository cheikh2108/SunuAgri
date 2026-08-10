import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext, isAdmin } from "@/lib/auth/session";
import { ReportStatus } from "@/app/generated/prisma/client";

const schema = z.object({
  status: z.nativeEnum(ReportStatus),
  resolutionNote: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx || !isAdmin(ctx)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updated = await prisma.report.update({
    where: { id },
    data: {
      status: parsed.data.status,
      resolutionNote: parsed.data.resolutionNote,
      resolvedAt: new Date(),
      resolvedBy: ctx.userId,
    },
  });

  return NextResponse.json(updated);
}

// GET /api/admin/reports — liste des signalements
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx || !isAdmin(ctx)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return NextResponse.json({ error: "Use /api/admin/reports (without id) for listing" }, { status: 400 });
}
