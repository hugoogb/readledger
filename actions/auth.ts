"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  OtpThrottledError,
  consumeOtp,
  issueOtp,
  purgeOldOtps,
} from "@/lib/auth/otp";
import {
  SESSION_COOKIE,
  clearedSessionCookieOptions,
  createSession,
  purgeExpiredSessions,
  revokeSession,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { sendOtpEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { RateLimitError, checkRateLimit } from "@/lib/rate-limit";
import { emailSchema, otpSchema } from "@/lib/validations";

export type SendOtpResult = { email: string; error?: never } | { error: string; email?: never };

/**
 * The reverse proxy must overwrite X-Real-IP with the connecting address.
 * X-Forwarded-For is not used: its left-most entry is client-controlled.
 */
async function clientIp(): Promise<string> {
  return (await headers()).get("x-real-ip") ?? "unknown";
}

export async function sendOtp(formData: FormData): Promise<SendOtpResult> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const email = parsed.data;

  try {
    checkRateLimit(`otp-send:${await clientIp()}`, 20, 60 * 60_000);
    const code = await issueOtp(email);
    // Deliberately not awaited: the response must look the same whether or
    // not the address has an account, and must not wait on the email
    // provider. Safe on a long-lived Node server (not serverless).
    sendOtpEmail(email, code).catch((error) =>
      logger.error("Failed to send OTP email", { error: String(error) }),
    );
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof OtpThrottledError) {
      return { error: error.message };
    }
    throw error;
  }

  Promise.all([purgeOldOtps(), purgeExpiredSessions()]).catch((error) =>
    logger.warn("Auth cleanup failed", { error: String(error) }),
  );

  return { email };
}

export async function verifyOtp(formData: FormData): Promise<{ error: string } | void> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { error: "Something went wrong. Please request a new code." };
  }
  const code = otpSchema.safeParse(
    String(formData.get("code") ?? "").replace(/\s/g, ""),
  );
  if (!code.success) {
    return { error: code.error.issues[0].message };
  }

  try {
    checkRateLimit(`otp-verify:${await clientIp()}`, 30, 10 * 60_000);
  } catch (error) {
    if (error instanceof RateLimitError) return { error: error.message };
    throw error;
  }

  if (!(await consumeOtp(email.data, code.data))) {
    return { error: "That code is invalid or has expired." };
  }

  // Existing accounts (including users migrated from Supabase) are matched by
  // email; new addresses get an account on first sign-in.
  const user = await prisma.user.upsert({
    where: { email: email.data },
    update: {},
    create: { email: email.data },
  });

  const { token, expiresAt } = await createSession(
    user.id,
    (await headers()).get("user-agent"),
  );
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await revokeSession(token);
  }
  cookieStore.set(SESSION_COOKIE, "", clearedSessionCookieOptions());

  revalidatePath("/", "layout");
  redirect("/login");
}
