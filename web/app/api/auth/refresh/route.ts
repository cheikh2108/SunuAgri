import { refreshToken } from "@/lib/auth/jwt";
import { handleError, AuthError, ValidationError } from "@/lib/errors";
import { z } from "zod";

const refreshSchema = z.object({
  token: z.string().min(1, "Token requis"),
});

/**
 * POST /api/auth/refresh
 *
 * Renouvelle un JWT proche de l'expiration.
 * La session associée doit être toujours valide.
 *
 * Body: { token: string }
 * Response: { token: string } | { error }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = refreshSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError("Token manquant", parsed.error.flatten().fieldErrors);
    }

    const { token } = parsed.data;

    const newToken = await refreshToken(token);

    if (!newToken) {
      throw new AuthError(
        "Impossible de renouveler le token. Session invalide ou expirée.",
        "REFRESH_FAILED"
      );
    }

    return Response.json({ token: newToken });
  } catch (error) {
    return handleError(error);
  }
}
