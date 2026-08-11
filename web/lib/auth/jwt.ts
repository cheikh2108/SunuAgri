import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-in-production"
);

const EXPIRES_IN = "7d";
const REFRESH_THRESHOLD = 24 * 60 * 60; // 24h en secondes

export interface JwtPayload {
  userId: string;
  sessionId: string;
}

/**
 * Génère un nouveau JWT pour une session
 */
export async function generateToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET);
}

/**
 * Alias pour generateToken (rétrocompatibilité)
 */
export async function signToken(payload: JwtPayload): Promise<string> {
  return generateToken(payload);
}

/**
 * Vérifie et décode un JWT
 * Retourne le payload si valide, null sinon
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Renouvelle un token expiré ou proche de l'expiration
 * Vérifie que la session associée est toujours valide
 *
 * @returns nouveau token si la session est valide, null sinon
 */
export async function refreshToken(oldToken: string): Promise<string | null> {
  const payload = await verifyToken(oldToken);
  if (!payload) return null;

  // Vérifier que la session existe et est toujours valide
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt < new Date()) return null;
  if (session.userId !== payload.userId) return null;

  // Générer un nouveau token avec le même payload
  return generateToken({
    userId: payload.userId,
    sessionId: payload.sessionId,
  });
}

/**
 * Vérifie si un token est proche de l'expiration
 * Utile pour déclencher un refresh automatique côté client
 */
export async function shouldRefreshToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const exp = payload.exp;
    if (!exp) return false;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = exp - now;

    return timeUntilExpiry < REFRESH_THRESHOLD;
  } catch {
    return false;
  }
}
