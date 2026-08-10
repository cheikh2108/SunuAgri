import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/auth/otp";
import { sendOtpSms } from "@/lib/sms";

const schema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });
  }

  const { phone } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phone } });
  // Réponse identique que l'utilisateur existe ou non (anti-énumération)
  if (!user || user.isSuspended) {
    return NextResponse.json({ message: "Si ce numéro existe, un code a été envoyé." });
  }

  const code = await createOtp(user.id);
  await sendOtpSms(phone, code);

  return NextResponse.json({ message: "Si ce numéro existe, un code a été envoyé." });
}
