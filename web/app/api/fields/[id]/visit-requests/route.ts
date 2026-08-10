import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";
import { ListingStatus, VisitRequestStatus } from "@/app/generated/prisma/client";

const createSchema = z.object({
  requestedDate: z.string().datetime(),
  visitorCount: z.number().int().min(1).max(20).default(1),
  message: z.string().max(500).optional(),
  needsAgentHelp: z.boolean().default(false),
});

const respondSchema = z.object({
  visitRequestId: z.string(),
  action: z.enum(["accept", "refuse", "reschedule"]),
  responseMessage: z.string().max(500).optional(),
  scheduledAt: z.string().datetime().optional(),
});

// POST /api/fields/[id]/visit-requests — créer ou répondre à une demande de visite
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

  // Si le body contient visitRequestId, c'est une réponse du propriétaire
  if (body?.visitRequestId) {
    return handleResponse(req, ctx, field, body);
  }

  return handleCreate(ctx, fieldId, field, body);
}

async function handleCreate(
  ctx: Awaited<ReturnType<typeof getAuthContext>>,
  fieldId: string,
  field: { profileId: string },
  body: unknown
) {
  const visitorProfile = ctx!.profiles.find((p) =>
    ["PRODUCER", "BUYER", "INVESTOR"].includes(p.type)
  );
  if (!visitorProfile) {
    return NextResponse.json({ error: "Profil visiteur requis" }, { status: 403 });
  }

  // Le propriétaire ne peut pas faire une demande sur son propre champ
  if (ctx!.profiles.some((p) => p.id === field.profileId)) {
    return NextResponse.json({ error: "Action non permise sur votre propre annonce" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const visitRequest = await prisma.visitRequest.create({
    data: {
      fieldId,
      visitorProfileId: visitorProfile.id,
      requestedDate: new Date(parsed.data.requestedDate),
      visitorCount: parsed.data.visitorCount,
      message: parsed.data.message,
      needsAgentHelp: parsed.data.needsAgentHelp,
      status: VisitRequestStatus.REQUESTED,
    },
  });

  return NextResponse.json(visitRequest, { status: 201 });
}

async function handleResponse(
  req: NextRequest,
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

  const { visitRequestId, action, responseMessage, scheduledAt } = parsed.data;

  const statusMap: Record<string, VisitRequestStatus> = {
    accept: VisitRequestStatus.ACCEPTED,
    refuse: VisitRequestStatus.REFUSED,
    reschedule: VisitRequestStatus.RESCHEDULED,
  };

  const updated = await prisma.visitRequest.update({
    where: { id: visitRequestId },
    data: {
      status: statusMap[action],
      responseMessage,
      ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
    },
  });

  return NextResponse.json(updated);
}

// GET /api/fields/[id]/visit-requests — liste des demandes (propriétaire ou admin)
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

  const requests = await prisma.visitRequest.findMany({
    where: { fieldId },
    orderBy: { createdAt: "desc" },
    include: {
      visitorProfile: {
        select: { id: true, displayName: true, photoUrl: true, verificationLevels: true },
      },
    },
  });

  return NextResponse.json(requests);
}
