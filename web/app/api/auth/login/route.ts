import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";

const schema = z
  .object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string(),
  })
  .refine((d) => d.phone || d.email, {
    message: "Téléphone ou email requis",
  });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { phone, email, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: phone ? { phone } : { email },
  });

  // Message volontairement générique (anti-énumération)
  const INVALID = { error: "Identifiants incorrects" };

  if (!user || !user.passwordHash) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  if (user.isSuspended) {
    return NextResponse.json(
      { error: "Ce compte est suspendu." },
      { status: 403 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: { userId: user.id, token: crypto.randomUUID(), expiresAt },
  });

  const token = await signToken({ userId: user.id, sessionId: session.id });

  // token retourné aussi dans le body pour les clients mobiles (pas de cookie HttpOnly)
  const response = NextResponse.json({ message: "Connecté", token });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return response;
}
