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
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://uploads.mangadex.org",
    "font-src 'self'",
    "connect-src 'self' https://api.mangadex.org",
    "frame-ancestors 'none'",
  ].join("; "),
};

const protectedRoutes = ["/dashboard"];
// The landing and auth pages only serve logged-out visitors; a signed-in user
// opening them should land in the app instead.
const publicEntryRoutes = ["/", "/login", "/register"];

type SessionState =
  | { status: "none" }
  | { status: "invalid" }
  | { status: "valid"; token: string; refreshedExpiresAt: Date | null }
  | { status: "unknown" };

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
    // Database unreachable: don't log the user out over an outage. Pages call
    // requireUser() and will surface the error themselves.
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
  // Leftover Supabase auth cookies from before the migration.
  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-")) response.cookies.delete(name);
  }
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  // Canonical host: the edge Caddy routes www.readledger.app here too (and
  // passes the original Host through), so redirect it to the apex before
  // doing any work.
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(
      new URL(`${pathname}${search}`, `https://${host.slice(4)}`),
      308,
    );
  }

  const session = await resolveSession(request);
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  if (isProtectedRoute && (session.status === "none" || session.status === "invalid")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withCookies(NextResponse.redirect(url), request, session);
  }

  if (publicEntryRoutes.includes(pathname) && session.status === "valid") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return withCookies(NextResponse.redirect(url), request, session);
  }

  return withCookies(NextResponse.next({ request }), request, session);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
