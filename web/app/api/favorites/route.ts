import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";

const addSchema = z.object({
  fieldId: z.string().optional(),
  productionId: z.string().optional(),
}).refine((d) => d.fieldId || d.productionId, {
  message: "fieldId ou productionId requis",
});

// GET /api/favorites — liste des favoris
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profileIds = ctx.profiles.map((p) => p.id);

  const favorites = await prisma.favorite.findMany({
    where: { profileId: { in: profileIds } },
    include: {
      field: {
        select: { id: true, title: true, status: true, region: true, commune: true, price: true, areaSqm: true },
      },
      production: {
        select: { id: true, name: true, status: true, category: true, price: true, quantityAvailable: true, quantityUnit: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}

// POST /api/favorites — ajouter un favori
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profile = ctx.profiles[0];
  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { fieldId, productionId } = parsed.data;

  const favorite = await prisma.favorite.upsert({
    where: fieldId
      ? { profileId_fieldId: { profileId: profile.id, fieldId } }
      : { profileId_productionId: { profileId: profile.id, productionId: productionId! } },
    create: { profileId: profile.id, fieldId, productionId },
    update: {},
  });

  return NextResponse.json(favorite, { status: 201 });
}

// DELETE /api/favorites — retirer un favori
export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profile = ctx.profiles[0];
  const { searchParams } = req.nextUrl;
  const fieldId = searchParams.get("fieldId") ?? undefined;
  const productionId = searchParams.get("productionId") ?? undefined;

  if (!fieldId && !productionId) {
    return NextResponse.json({ error: "fieldId ou productionId requis" }, { status: 400 });
  }

  await prisma.favorite.deleteMany({
    where: {
      profileId: profile.id,
      ...(fieldId ? { fieldId } : { productionId }),
    },
  });

  return NextResponse.json({ message: "Retiré des favoris" });
}
