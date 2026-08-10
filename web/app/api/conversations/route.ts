import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";

const createSchema = z.object({
  recipientProfileId: z.string(),
});

// POST /api/conversations — démarrer ou récupérer une conversation existante
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const senderProfile = ctx.profiles[0];
  const { recipientProfileId } = parsed.data;

  if (senderProfile.id === recipientProfileId) {
    return NextResponse.json({ error: "Impossible de démarrer une conversation avec soi-même" }, { status: 400 });
  }

  // Chercher une conversation existante entre ces deux profils
  const existing = await prisma.conversation.findFirst({
    where: {
      participants: {
        every: { profileId: { in: [senderProfile.id, recipientProfileId] } },
      },
    },
    include: {
      participants: { include: { profile: { select: { id: true, displayName: true, photoUrl: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (existing) return NextResponse.json(existing);

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { profileId: senderProfile.id },
          { profileId: recipientProfileId },
        ],
      },
    },
    include: {
      participants: { include: { profile: { select: { id: true, displayName: true, photoUrl: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json(conversation, { status: 201 });
}

// GET /api/conversations — liste des conversations de l'utilisateur connecté
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profileIds = ctx.profiles.map((p) => p.id);

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { profileId: { in: profileIds } } },
    },
    include: {
      participants: {
        include: { profile: { select: { id: true, displayName: true, photoUrl: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}
