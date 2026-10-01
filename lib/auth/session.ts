import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_TTL_MS = 60 * 24 * 60 * 60_000;
export const SESSION_REFRESH_AFTER_MS = 24 * 60 * 60_000;

const isProduction = process.env.NODE_ENV === "production";

// `__Host-` requires Secure, Path=/ and no Domain, so sibling subdomains
// (e.g. staging) cannot set or overwrite it. Browsers reject it over plain
// http, hence the unprefixed name in development.
export const SESSION_COOKIE = isProduction ? "__Host-rl_session" : "rl_session";

// 32 random bytes encoded as base64url.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/**
 * Options for expiring the cookie. A `__Host-` cookie can only be overwritten
 * by a Set-Cookie carrying the same Secure/Path attributes, so a bare
 * delete-by-name would be ignored by browsers in production.
 */
export function clearedSessionCookieOptions() {
  return { ...sessionCookieOptions(new Date(0)), maxAge: 0 };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, userAgent?: string | null) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: userAgent?.slice(0, 512) ?? null,
    },
  });

  return { token, expiresAt };
}

/**
 * Resolves a session token to its user. With `refresh`, sessions not seen for
 * a day get their expiry pushed out (sliding expiration); the caller must then
 * re-set the cookie with the returned `expiresAt`.
 */
export async function validateSession(
  token: string,
  { refresh = false }: { refresh?: boolean } = {},
) {
  if (!TOKEN_PATTERN.test(token)) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  if (refresh && now - session.lastSeenAt.getTime() > SESSION_REFRESH_AFTER_MS) {
    const expiresAt = new Date(now + SESSION_TTL_MS);
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt, lastSeenAt: new Date(now) },
    });
    return { user: session.user, expiresAt, refreshed: true };
  }

  return { user: session.user, expiresAt: session.expiresAt, refreshed: false };
}

export async function revokeSession(token: string): Promise<void> {
  if (!TOKEN_PATTERN.test(token)) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function purgeExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
