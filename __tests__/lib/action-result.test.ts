import { describe, expect, it } from "vitest";
import { z } from "zod";
import { withResult } from "@/lib/action-result";
import { NotFoundError } from "@/lib/errors";
import { RateLimitError } from "@/lib/rate-limit";
import { unwrap } from "@/lib/unwrap";

describe("withResult", () => {
  it("returns data on success", async () => {
    const action = withResult(async (n: number) => n * 2);
    expect(await action(2)).toEqual({ ok: true, data: 4 });
  });

  it("returns user-facing messages for expected errors", async () => {
    const cases: [unknown, string][] = [
      [new NotFoundError("Series"), "Series not found"],
      [new RateLimitError("Slow down"), "Slow down"],
      [Object.assign(new Error("unique"), { code: "P2002" }), "That name is already in use"],
    ];
    for (const [err, message] of cases) {
      const action = withResult(async () => {
        throw err;
      });
      expect(await action()).toEqual({ ok: false, error: message });
    }

    const zodAction = withResult(async () => z.string().min(3, "Too short").parse("a"));
    expect(await zodAction()).toEqual({ ok: false, error: "Too short" });
  });

  it("hides unexpected error details", async () => {
    const action = withResult(async () => {
      throw new Error("connection refused at 10.0.0.3");
    });
    expect(await action()).toEqual({
      ok: false,
      error: "Something went wrong. Please try again.",
    });
  });

  it("rethrows Next.js control-flow errors (redirect/notFound)", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;/login" });
    const action = withResult(async () => {
      throw redirect;
    });
    await expect(action()).rejects.toBe(redirect);
  });
});

describe("unwrap", () => {
  it("returns data or throws the error message", () => {
    expect(unwrap({ ok: true, data: 1 })).toBe(1);
    expect(() => unwrap({ ok: false, error: "Nope" })).toThrow("Nope");
  });
});
