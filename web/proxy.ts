import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/api/fields",
  "/api/productions",
  "/api/conversations",
  "/api/notifications",
  "/api/favorites",
  "/api/reports",
  "/api/dashboard",
  "/api/profile",
  "/api/supply-needs",
];
const ADMIN_PREFIXES = ["/admin", "/api/admin"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAdmin) return NextResponse.next();

  const authHeader = req.headers.get("authorization");
  const token =
    req.cookies.get("auth_token")?.value ??
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined);
  if (!token) return unauthorized(req, pathname);

  const payload = await verifyToken(token);
  if (!payload) return unauthorized(req, pathname);

  const headers = new Headers(req.headers);
  headers.set("x-user-id", payload.userId);
  headers.set("x-session-id", payload.sessionId);

  return NextResponse.next({ request: { headers } });
}

function unauthorized(req: NextRequest, pathname: string) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/fields/:path*",
    "/api/productions/:path*",
    "/api/conversations/:path*",
    "/api/notifications/:path*",
    "/api/favorites/:path*",
    "/api/reports/:path*",
    "/api/dashboard/:path*",
    "/api/profile/:path*",
    "/api/supply-needs/:path*",
    "/api/admin/:path*",
  ],
};
