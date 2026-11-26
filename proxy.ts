import { type NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  clearedSessionCookieOptions,
  sessionCookieOptions,
  validateSession,
} from "@/lib/auth/session";
import { logger } from "@/lib/logger";

const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
};

const protectedRoutes = ["/dashboard"];
const publicEntryRoutes = ["/", "/login"];

type SessionState =
  | { status: "none" }
  | { status: "invalid" }
  | { status: "valid"; token: string; refreshedExpiresAt: Date | null }
  | { status: "unknown" }
  | { status: "skipped" };

async function resolveSession(request: NextRequest): Promise<SessionState> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return { status: "none" };

  try {
    const session = await validateSession(token, { refresh: true });
    if (!session) return { status: "invalid" };
    return {
      status: "valid",
      token,
      refreshedExpiresAt: session.refreshed ? session.expiresAt : null,
    };
  } catch (error) {
    logger.error("Session check failed in proxy", { error: String(error) });
    return { status: "unknown" };
  }
}

function withCookies(response: NextResponse, request: NextRequest, session: SessionState) {
  if (session.status === "invalid") {
    response.cookies.set(SESSION_COOKIE, "", clearedSessionCookieOptions());
  }
  if (session.status === "valid" && session.refreshedExpiresAt) {
    response.cookies.set(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions(session.refreshedExpiresAt),
    );
  }
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicEntryRoute = publicEntryRoutes.includes(pathname);

  const session: SessionState =
    isProtectedRoute || isPublicEntryRoute
      ? await resolveSession(request)
      : { status: "skipped" };

  if (isProtectedRoute && (session.status === "none" || session.status === "invalid")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withCookies(NextResponse.redirect(url), request, session);
  }

  if (isPublicEntryRoute && session.status === "valid") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return withCookies(NextResponse.redirect(url), request, session);
  }

  return withCookies(NextResponse.next({ request }), request, session);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|health|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
