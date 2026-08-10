import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const all = req.nextUrl.searchParams.get("all") === "true";

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      if (all) {
        // Déconnexion de tous les appareils
        await prisma.session.updateMany({
          where: { userId: payload.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } else {
        await prisma.session.updateMany({
          where: { id: payload.sessionId },
          data: { revokedAt: new Date() },
        });
      }
    }
  }

  const response = NextResponse.json({ message: "Déconnecté" });
  response.cookies.delete("auth_token");
  return response;
}
