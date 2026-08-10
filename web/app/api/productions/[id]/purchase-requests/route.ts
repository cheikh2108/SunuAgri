import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";
import {
  ListingStatus,
  OfferStatus,
  TransactionStatus,
} from "@/app/generated/prisma/client";

const createSchema = z.object({
  quantity: z.number().positive(),
  proposedPrice: z.number().positive().optional(),
  desiredDate: z.string().datetime().optional(),
  deliveryLocation: z.string().optional(),
  frequency: z.string().optional(),
  qualityRequirements: z.string().optional(),
  paymentConditions: z.string().optional(),
});

const respondSchema = z.object({
  purchaseRequestId: z.string(),
  action: z.enum(["accept", "refuse", "counter"]),
  counterAmount: z.number().positive().optional(),
  responseMessage: z.string().max(500).optional(),
});

// POST /api/productions/[id]/purchase-requests — créer ou répondre à une demande d'achat
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productionId } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const production = await prisma.production.findUnique({ where: { id: productionId } });
  if (!production || production.status !== ListingStatus.PUBLISHED) {
    return NextResponse.json({ error: "Production introuvable" }, { status: 404 });
  }

  // Règle §9.7 : production épuisée non commandable
  if (production.quantityAvailable <= 0) {
    return NextResponse.json({ error: "Cette production est épuisée" }, { status: 409 });
  }

  const body = await req.json().catch(() => null);

  if (body?.purchaseRequestId) {
    return handleResponse(ctx, production, body);
  }

  return handleCreate(ctx, productionId, production, body);
}

async function handleCreate(
  ctx: Awaited<ReturnType<typeof getAuthContext>>,
  productionId: string,
  production: { profileId: string; price: number },
  body: unknown
) {
  const buyerProfile = ctx!.profiles.find((p) =>
    ["BUYER", "PRODUCER", "INVESTOR"].includes(p.type)
  );
  if (!buyerProfile) {
    return NextResponse.json({ error: "Profil acheteur requis" }, { status: 403 });
  }

  if (ctx!.profiles.some((p) => p.id === production.profileId)) {
    return NextResponse.json({ error: "Action non permise sur votre propre production" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  const purchaseRequest = await prisma.purchaseRequest.create({
    data: {
      productionId,
      buyerProfileId: buyerProfile.id,
      quantity: data.quantity,
      proposedPrice: data.proposedPrice,
      desiredDate: data.desiredDate ? new Date(data.desiredDate) : undefined,
      deliveryLocation: data.deliveryLocation,
      frequency: data.frequency,
      qualityRequirements: data.qualityRequirements,
      paymentConditions: data.paymentConditions,
      status: OfferStatus.PENDING,
    },
  });

  const transaction = await prisma.transaction.create({
    data: {
      purchaseRequestId: purchaseRequest.id,
      status: TransactionStatus.REQUEST_SENT,
    },
  });

  await prisma.transactionEvent.create({
    data: {
      transactionId: transaction.id,
      eventType: "PURCHASE_REQUEST_CREATED",
      payload: {
        purchaseRequestId: purchaseRequest.id,
        quantity: purchaseRequest.quantity,
        proposedPrice: purchaseRequest.proposedPrice,
      },
    },
  });

  return NextResponse.json({ purchaseRequest, transactionId: transaction.id }, { status: 201 });
}

async function handleResponse(
  ctx: Awaited<ReturnType<typeof getAuthContext>>,
  production: { profileId: string },
  body: unknown
) {
  const isOwner = ctx!.profiles.some((p) => p.id === production.profileId);
  if (!isOwner) {
    return NextResponse.json({ error: "Seul le producteur peut répondre" }, { status: 403 });
  }

  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { purchaseRequestId, action, counterAmount, responseMessage } = parsed.data;

  const pr = await prisma.purchaseRequest.findUnique({
    where: { id: purchaseRequestId },
    include: { transaction: true },
  });
  if (!pr) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

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

  const updated = await prisma.purchaseRequest.update({
    where: { id: purchaseRequestId },
    data: {
      status: statusMap[action],
      responseMessage,
    },
  });

  if (pr.transaction) {
    await prisma.transaction.update({
      where: { id: pr.transaction.id },
      data: { status: txStatusMap[action] },
    });

    await prisma.transactionEvent.create({
      data: {
        transactionId: pr.transaction.id,
        eventType: `PURCHASE_${action.toUpperCase()}`,
        payload: { action, counterAmount, responseMessage },
      },
    });
  }

  return NextResponse.json(updated);
}

// GET /api/productions/[id]/purchase-requests — liste (producteur ou admin)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productionId } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const production = await prisma.production.findUnique({ where: { id: productionId } });
  if (!production) return NextResponse.json({ error: "Production introuvable" }, { status: 404 });

  const isOwner = ctx.profiles.some((p) => p.id === production.profileId);
  const admin = ctx.profiles.some((p) => ["ADMIN", "SUPER_ADMIN"].includes(p.type));

  if (!isOwner && !admin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const requests = await prisma.purchaseRequest.findMany({
    where: { productionId },
    orderBy: { createdAt: "desc" },
    include: {
      buyerProfile: {
        select: { id: true, displayName: true, photoUrl: true, verificationLevels: true },
      },
      transaction: { select: { id: true, status: true } },
    },
  });

  return NextResponse.json(requests);
}
