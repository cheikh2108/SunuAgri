import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/api/fields",
  "/api/productions",
  "/api/conversations",
  "/api/notifications",
  "/api/favorites",
  "/api/reports",
  "/api/dashboard",
  "/api/profile",
  "/api/profiles",
  "/api/supply-needs",
];
const ADMIN_PREFIXES = ["/admin", "/api/admin"];

// Routes publiques (pas d'auth requise)
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/otp",
  "/api/health",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route.endsWith("*")) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Laisser passer les routes publiques et les assets
  if (
    isPublicRoute(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

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
    "/onboarding/:path*",
    "/admin/:path*",
    "/api/fields/:path*",
    "/api/productions/:path*",
    "/api/conversations/:path*",
    "/api/notifications/:path*",
    "/api/favorites/:path*",
    "/api/reports/:path*",
    "/api/dashboard/:path*",
    "/api/profile/:path*",
    "/api/profiles/:path*",
    "/api/supply-needs/:path*",
    "/api/admin/:path*",
  ],
};
