import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 30_000;
export const OTP_MAX_PER_HOUR = 5;
const OTP_RETENTION_MS = 24 * 60 * 60_000;

export class OtpThrottledError extends AppError {
  constructor() {
    super(
      "Too many codes requested. Please wait a moment and try again.",
      "OTP_THROTTLED",
      429,
    );
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters");
  }
  return secret;
}

export function generateOtp(): string {
  return randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

/** HMAC bound to the email, so a code is only valid for the address it was sent to. */
export function hashOtp(email: string, code: string): string {
  return createHmac("sha256", getAuthSecret())
    .update(`${email}:${code}`)
    .digest("hex");
}

function hashesEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Creates a new code for `email`, superseding any live one, and returns it so
 * the caller can send it. Throws OtpThrottledError when sending too often.
 */
export async function issueOtp(email: string): Promise<string> {
  const code = generateOtp();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Serialise concurrent requests for the same email so the throttle checks
    // and the "one live code" invariant hold under parallel submissions.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;

    const recent = await tx.otpCode.findMany({
      where: { email, createdAt: { gte: new Date(now.getTime() - 60 * 60_000) } },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const last = recent[0];
    if (last && now.getTime() - last.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      throw new OtpThrottledError();
    }
    if (recent.length >= OTP_MAX_PER_HOUR) {
      throw new OtpThrottledError();
    }

    await tx.otpCode.updateMany({
      where: { email, consumedAt: null },
      data: { consumedAt: now },
    });
    await tx.otpCode.create({
      data: {
        email,
        codeHash: hashOtp(email, code),
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      },
    });
  });

  return code;
}

/**
 * Verifies and consumes a code. Returns true exactly once per valid code.
 */
export async function consumeOtp(email: string, code: string): Promise<boolean> {
  // Count the attempt and fetch the live code in a single statement, so
  // parallel guesses cannot exceed OTP_MAX_ATTEMPTS. Timestamps are stored as
  // UTC `timestamp without time zone`, hence the explicit UTC conversion.
  const rows = await prisma.$queryRaw<{ id: string; codeHash: string }[]>`
    UPDATE "otp_codes"
    SET "attempts" = "attempts" + 1
    WHERE "email" = ${email}
      AND "consumedAt" IS NULL
      AND "expiresAt" > (NOW() AT TIME ZONE 'UTC')
      AND "attempts" < ${OTP_MAX_ATTEMPTS}
    RETURNING "id", "codeHash"`;

  const candidate = hashOtp(email, code);
  const match = rows.find((row) => hashesEqual(row.codeHash, candidate));
  if (!match) return false;

  // Guard against two concurrent correct submissions both succeeding.
  const { count } = await prisma.otpCode.updateMany({
    where: { id: match.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return count === 1;
}

export async function purgeOldOtps(): Promise<void> {
  await prisma.otpCode.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - OTP_RETENTION_MS) } },
  });
}
