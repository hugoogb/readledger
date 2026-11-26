import { cache } from "react";
import { cookies } from "next/headers";
import { UnauthorizedError } from "@/lib/errors";
import { SESSION_COOKIE, validateSession } from "@/lib/auth/session";

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await validateSession(token);
  return session?.user ?? null;
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}
