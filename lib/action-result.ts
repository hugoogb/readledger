import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { RateLimitError } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function userMessage(err: unknown): string | null {
  if (err instanceof AppError || err instanceof RateLimitError) return err.message;
  if (err instanceof ZodError) return err.issues[0]?.message ?? "Invalid input";
  if (typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002") {
    return "That name is already in use";
  }
  return null;
}

export function withResult<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
): (...args: Args) => Promise<ActionResult<T>> {
  return async (...args: Args) => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (err) {
      const message = userMessage(err);
      if (message !== null) return { ok: false, error: message };
      if (typeof err === "object" && err !== null && "digest" in err) throw err;
      logger.error("Server action failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  };
}
