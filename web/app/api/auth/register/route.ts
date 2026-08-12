import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createOtp } from "@/lib/auth/otp";
import { sendOtpSms } from "@/lib/sms";

const schema = z
  .object({
    phone: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8),
  })
  .refine((d) => d.phone || d.email, {
    message: "Un numéro de téléphone ou un email est requis",
  });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { phone, email, password } = parsed.data;

  // Vérifier doublon téléphone
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "Ce numéro est déjà utilisé" },
        { status: 409 }
      );
    }
  }

  // Vérifier doublon email
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      phone,
      email,
      passwordHash,
      // Pas de profil créé automatiquement - l'utilisateur choisira lors de l'onboarding
    },
    select: { id: true, phone: true, email: true },
  });

  // Envoyer OTP si inscription par téléphone
  if (phone) {
    const code = await createOtp(user.id);
    await sendOtpSms(phone, code);
  }

  return NextResponse.json(
    { userId: user.id, message: "Compte créé. Vérifiez votre téléphone." },
    { status: 201 }
  );
}
