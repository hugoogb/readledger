import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { prismaMock } from "@/__tests__/__mocks__/prisma";
import {
  OTP_MAX_ATTEMPTS,
  OTP_MAX_PER_HOUR,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  OtpThrottledError,
  consumeOtp,
  generateOtp,
  hashOtp,
  issueOtp,
  normalizeEmail,
} from "@/lib/auth/otp";

const EMAIL = "reader@example.com";
const NOW = new Date("2026-09-30T12:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("AUTH_SECRET", "x".repeat(32));
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("normalizeEmail", () => {
  it("trims and lower-cases", () => {
    expect(normalizeEmail("  Reader@Example.COM ")).toBe("reader@example.com");
  });
});

describe("generateOtp", () => {
  it("returns 6 digits, zero-padded", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });
});

describe("hashOtp", () => {
  it("is deterministic and bound to the email", () => {
    expect(hashOtp(EMAIL, "123456")).toBe(hashOtp(EMAIL, "123456"));
    expect(hashOtp(EMAIL, "123456")).not.toBe(hashOtp("other@example.com", "123456"));
    expect(hashOtp(EMAIL, "123456")).not.toBe(hashOtp(EMAIL, "123457"));
  });

  it("refuses to run without a strong secret", () => {
    vi.stubEnv("AUTH_SECRET", "short");
    expect(() => hashOtp(EMAIL, "123456")).toThrow(/AUTH_SECRET/);
  });
});

describe("issueOtp", () => {
  it("supersedes live codes and stores only the hash", async () => {
    prismaMock.otpCode.findMany.mockResolvedValue([]);

    const code = await issueOtp(EMAIL);

    expect(code).toMatch(/^\d{6}$/);
    expect(prismaMock.$executeRaw).toHaveBeenCalled(); // advisory lock
    expect(prismaMock.otpCode.updateMany).toHaveBeenCalledWith({
      where: { email: EMAIL, consumedAt: null },
      data: { consumedAt: NOW },
    });
    const { data } = prismaMock.otpCode.create.mock.calls[0][0];
    expect(data.codeHash).toBe(hashOtp(EMAIL, code));
    expect(JSON.stringify(data)).not.toContain(code);
    expect(data.expiresAt).toEqual(new Date(NOW.getTime() + OTP_TTL_MS));
  });

  it("enforces the resend cooldown", async () => {
    prismaMock.otpCode.findMany.mockResolvedValue([
      { createdAt: new Date(NOW.getTime() - OTP_RESEND_COOLDOWN_MS + 1000) },
    ]);

    await expect(issueOtp(EMAIL)).rejects.toBeInstanceOf(OtpThrottledError);
    expect(prismaMock.otpCode.create).not.toHaveBeenCalled();
  });

  it("enforces the hourly cap", async () => {
    prismaMock.otpCode.findMany.mockResolvedValue(
      Array.from({ length: OTP_MAX_PER_HOUR }, (_, i) => ({
        createdAt: new Date(NOW.getTime() - (i + 1) * 5 * 60_000),
      })),
    );

    await expect(issueOtp(EMAIL)).rejects.toBeInstanceOf(OtpThrottledError);
    expect(prismaMock.otpCode.create).not.toHaveBeenCalled();
  });
});

describe("consumeOtp", () => {
  it("accepts the right code once", async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      { id: "otp-1", codeHash: hashOtp(EMAIL, "042042") },
    ]);
    prismaMock.otpCode.updateMany.mockResolvedValue({ count: 1 });

    await expect(consumeOtp(EMAIL, "042042")).resolves.toBe(true);
    expect(prismaMock.otpCode.updateMany).toHaveBeenCalledWith({
      where: { id: "otp-1", consumedAt: null },
      data: { consumedAt: NOW },
    });
  });

  it("rejects a wrong code without consuming", async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      { id: "otp-1", codeHash: hashOtp(EMAIL, "042042") },
    ]);

    await expect(consumeOtp(EMAIL, "999999")).resolves.toBe(false);
    expect(prismaMock.otpCode.updateMany).not.toHaveBeenCalled();
  });

  it("rejects when no live code remains (expired, used or out of attempts)", async () => {
    prismaMock.$queryRaw.mockResolvedValue([]);

    await expect(consumeOtp(EMAIL, "042042")).resolves.toBe(false);
  });

  it("increments attempts atomically with the attempt cap in the same statement", async () => {
    prismaMock.$queryRaw.mockResolvedValue([]);

    await consumeOtp(EMAIL, "042042");

    const [strings, ...values] = prismaMock.$queryRaw.mock.calls[0];
    const sql = (strings as string[]).join("?");
    expect(sql).toMatch(/UPDATE "otp_codes"/);
    expect(sql).toMatch(/"attempts" = "attempts" \+ 1/);
    expect(sql).toMatch(/"attempts" < \?/);
    expect(sql).toMatch(/RETURNING/);
    expect(values).toContain(OTP_MAX_ATTEMPTS);
  });

  it("loses the race when another request consumed the code first", async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      { id: "otp-1", codeHash: hashOtp(EMAIL, "042042") },
    ]);
    prismaMock.otpCode.updateMany.mockResolvedValue({ count: 0 });

    await expect(consumeOtp(EMAIL, "042042")).resolves.toBe(false);
  });
});
