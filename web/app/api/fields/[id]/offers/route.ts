import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";
import {
  ListingStatus,
  OfferStatus,
  PartnershipType,
  TransactionStatus,
} from "@/app/generated/prisma/client";

const createSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("XOF"),
  durationDays: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  paymentMode: z.string().optional(),
  agriculturalProject: z.string().optional(),
  plannedCrops: z.array(z.string()).default([]),
  specialConditions: z.string().optional(),
  partnershipType: z.nativeEnum(PartnershipType).optional(),
});

const respondSchema = z.object({
  offerId: z.string(),
  action: z.enum(["accept", "refuse", "counter"]),
  counterAmount: z.number().positive().optional(),
  responseMessage: z.string().max(500).optional(),
});

// POST /api/fields/[id]/offers — soumettre ou répondre à une proposition
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fieldId } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const field = await prisma.field.findUnique({ where: { id: fieldId } });
  if (!field || field.status !== ListingStatus.PUBLISHED) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);

  if (body?.offerId) {
    return handleResponse(ctx, field, body);
  }

  return handleCreate(ctx, fieldId, field, body);
}

async function handleCreate(
  ctx: Awaited<ReturnType<typeof getAuthContext>>,
  fieldId: string,
  field: { profileId: string },
  body: unknown
) {
  const senderProfile = ctx!.profiles.find((p) =>
    ["PRODUCER", "BUYER", "INVESTOR"].includes(p.type)
  );
  if (!senderProfile) {
    return NextResponse.json({ error: "Profil acheteur/investisseur requis" }, { status: 403 });
  }

  if (ctx!.profiles.some((p) => p.id === field.profileId)) {
    return NextResponse.json({ error: "Action non permise sur votre propre annonce" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  const offer = await prisma.offer.create({
    data: {
      fieldId,
      senderProfileId: senderProfile.id,
      targetProfileId: field.profileId,
      amount: data.amount,
      currency: data.currency,
      durationDays: data.durationDays,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      paymentMode: data.paymentMode,
      agriculturalProject: data.agriculturalProject,
      plannedCrops: data.plannedCrops,
      specialConditions: data.specialConditions,
      partnershipType: data.partnershipType,
      status: OfferStatus.PENDING,
    },
  });

  // Créer la transaction associée (historique immuable — règle §9.10)
  const transaction = await prisma.transaction.create({
    data: {
      offerId: offer.id,
      status: TransactionStatus.OFFER_TRANSMITTED,
    },
  });

  await prisma.transactionEvent.create({
    data: {
      transactionId: transaction.id,
      eventType: "OFFER_CREATED",
      payload: { offerId: offer.id, amount: offer.amount, currency: offer.currency },
    },
  });

  return NextResponse.json({ offer, transactionId: transaction.id }, { status: 201 });
}

async function handleResponse(
  ctx: Awaited<ReturnType<typeof getAuthContext>>,
  field: { profileId: string },
  body: unknown
) {
  const isOwner = ctx!.profiles.some((p) => p.id === field.profileId);
  if (!isOwner) {
    return NextResponse.json({ error: "Seul le propriétaire peut répondre" }, { status: 403 });
  }

  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { offerId, action, counterAmount, responseMessage } = parsed.data;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { transaction: true },
  });

  if (!offer) return NextResponse.json({ error: "Proposition introuvable" }, { status: 404 });

  const statusMap: Record<string, OfferStatus> = {
    accept: OfferStatus.ACCEPTED,
    refuse: OfferStatus.REFUSED,
    counter: OfferStatus.COUNTER_PROPOSED,
  };

  const txStatusMap: Record<string, TransactionStatus> = {
    accept: TransactionStatus.OFFER_ACCEPTED,
    refuse: TransactionStatus.CANCELLED,
    counter: TransactionStatus.COUNTER_PROPOSAL,
  };

  const updatedOffer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: statusMap[action],
      counterAmount: action === "counter" ? counterAmount : undefined,
      responseMessage,
    },
  });

  // Enregistrer dans l'historique immuable (règle §9.10)
  if (offer.transaction) {
    await prisma.transaction.update({
      where: { id: offer.transaction.id },
      data: { status: txStatusMap[action] },
    });

    await prisma.transactionEvent.create({
      data: {
        transactionId: offer.transaction.id,
        eventType: `OFFER_${action.toUpperCase()}`,
        payload: { action, counterAmount, responseMessage },
      },
    });
  }

  return NextResponse.json(updatedOffer);
}

// GET /api/fields/[id]/offers — liste des propositions (propriétaire ou admin)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fieldId } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const field = await prisma.field.findUnique({ where: { id: fieldId } });
  if (!field) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });

  const isOwner = ctx.profiles.some((p) => p.id === field.profileId);
  const admin = ctx.profiles.some((p) => ["ADMIN", "SUPER_ADMIN"].includes(p.type));

  if (!isOwner && !admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const offers = await prisma.offer.findMany({
    where: { fieldId },
    orderBy: { createdAt: "desc" },
    include: {
      senderProfile: {
        select: { id: true, displayName: true, photoUrl: true, verificationLevels: true },
      },
      transaction: { select: { id: true, status: true } },
    },
  });

  return NextResponse.json(offers);
}
