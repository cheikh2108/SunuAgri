import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/auth/otp";
import { signToken } from "@/lib/auth/jwt";

const schema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { phone, code } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || user.isSuspended) {
    return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 401 });
  }

  const valid = await verifyOtp(user.id, code);
  if (!valid) {
    return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 401 });
  }

  // Marquer le téléphone comme vérifié
  await prisma.profile.updateMany({
    where: { userId: user.id },
    data: { verificationLevels: { push: "PHONE_VERIFIED" } },
  });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: { userId: user.id, token: crypto.randomUUID(), expiresAt },
  });

  const token = await signToken({ userId: user.id, sessionId: session.id });

  // token retourné aussi dans le body pour les clients mobiles
  const response = NextResponse.json({ message: "Téléphone vérifié", token });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return response;
}
