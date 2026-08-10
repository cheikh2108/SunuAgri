import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";

const createSchema = z.object({
  content: z.string().min(1).max(4000).optional(),
  attachmentUrl: z.string().url().optional(),
  attachmentType: z.string().optional(),
}).refine((d) => d.content || d.attachmentUrl, {
  message: "Un message ou une pièce jointe est requis",
});

// POST /api/conversations/[id]/messages — envoyer un message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profileIds = ctx.profiles.map((p) => p.id);

  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, profileId: { in: profileIds }, isBlocked: false },
  });

  if (!participant) {
    return NextResponse.json({ error: "Accès refusé à cette conversation" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderProfileId: participant.profileId,
      content: parsed.data.content,
      attachmentUrl: parsed.data.attachmentUrl,
      attachmentType: parsed.data.attachmentType,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}

// GET /api/conversations/[id]/messages — historique de la conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profileIds = ctx.profiles.map((p) => p.id);

  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, profileId: { in: profileIds } },
  });

  if (!participant) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      senderProfile: { select: { id: true, displayName: true, photoUrl: true } },
    },
  });

  // Marquer les messages non lus comme lus
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderProfileId: { notIn: profileIds },
      isRead: false,
    },
    data: { isRead: true },
  });

  return NextResponse.json(messages.reverse());
}
