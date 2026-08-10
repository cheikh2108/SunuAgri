import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";
import { ReportMotif } from "@/app/generated/prisma/client";

const createSchema = z.object({
  motif: z.nativeEnum(ReportMotif),
  description: z.string().min(10).max(2000),
  reportedProfileId: z.string().optional(),
  reportedFieldId: z.string().optional(),
  reportedProductionId: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
}).refine(
  (d) => d.reportedProfileId || d.reportedFieldId || d.reportedProductionId,
  { message: "Une cible (profil, champ ou production) est requise" }
);

// POST /api/reports — signaler un profil, une annonce ou une production
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profile = ctx.profiles[0];
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: {
      authorProfileId: profile.id,
      motif: parsed.data.motif,
      description: parsed.data.description,
      reportedProfileId: parsed.data.reportedProfileId,
      reportedFieldId: parsed.data.reportedFieldId,
      reportedProductionId: parsed.data.reportedProductionId,
      attachmentUrl: parsed.data.attachmentUrl,
    },
  });

  return NextResponse.json(report, { status: 201 });
}
