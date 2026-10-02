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
    // Next.js only needs eval in development (React Refresh).
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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
  | { status: "unknown" }
  // Route doesn't depend on auth, so the session wasn't looked up.
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
  // www -> apex is a Cloudflare Redirect Rule on the readledger.app zone, so
  // www requests never reach this server.
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicEntryRoute = publicEntryRoutes.includes(pathname);

  // Only routes that redirect on auth state need the session (a DB lookup).
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - health (container health check)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|health|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
