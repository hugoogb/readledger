import { createHash } from "node:crypto";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { prismaMock } from "@/__tests__/__mocks__/prisma";
import {
  SESSION_REFRESH_AFTER_MS,
  SESSION_TTL_MS,
  createSession,
  revokeSession,
  validateSession,
} from "@/lib/auth/session";

const NOW = new Date("2026-09-30T12:00:00Z");
const user = { id: "user-1", email: "reader@example.com" };
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => vi.useRealTimers());

async function newToken() {
  prismaMock.session.create.mockResolvedValue({});
  return (await createSession("user-1", "Mozilla/5.0")).token;
}

describe("createSession", () => {
  it("stores only the token hash, with a 60-day expiry", async () => {
    prismaMock.session.create.mockResolvedValue({});

    const { token, expiresAt } = await createSession("user-1", "Mozilla/5.0");

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(expiresAt).toEqual(new Date(NOW.getTime() + SESSION_TTL_MS));
    const { data } = prismaMock.session.create.mock.calls[0][0];
    expect(data.tokenHash).toBe(sha256(token));
    expect(JSON.stringify(data)).not.toContain(token);
  });
});

describe("validateSession", () => {
  it("rejects malformed tokens without touching the database", async () => {
    await expect(validateSession("not-a-token")).resolves.toBeNull();
    expect(prismaMock.session.findUnique).not.toHaveBeenCalled();
  });

  it("returns null for unknown tokens", async () => {
    const token = await newToken();
    prismaMock.session.findUnique.mockResolvedValue(null);

    await expect(validateSession(token)).resolves.toBeNull();
  });

  it("deletes and rejects expired sessions", async () => {
    const token = await newToken();
    prismaMock.session.findUnique.mockResolvedValue({
      id: "s-1",
      expiresAt: new Date(NOW.getTime() - 1),
      lastSeenAt: NOW,
      user,
    });

    await expect(validateSession(token)).resolves.toBeNull();
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { id: "s-1" } });
  });

  it("returns the user for a valid session without refreshing recent ones", async () => {
    const token = await newToken();
    const expiresAt = new Date(NOW.getTime() + 1000);
    prismaMock.session.findUnique.mockResolvedValue({
      id: "s-1",
      expiresAt,
      lastSeenAt: new Date(NOW.getTime() - 1000),
      user,
    });

    await expect(validateSession(token, { refresh: true })).resolves.toEqual({
      user,
      expiresAt,
      refreshed: false,
    });
    expect(prismaMock.session.update).not.toHaveBeenCalled();
  });

  it("slides the expiry when refreshing a session not seen for a day", async () => {
    const token = await newToken();
    prismaMock.session.findUnique.mockResolvedValue({
      id: "s-1",
      expiresAt: new Date(NOW.getTime() + 1000),
      lastSeenAt: new Date(NOW.getTime() - SESSION_REFRESH_AFTER_MS - 1),
      user,
    });

    const result = await validateSession(token, { refresh: true });

    const expiresAt = new Date(NOW.getTime() + SESSION_TTL_MS);
    expect(result).toEqual({ user, expiresAt, refreshed: true });
    expect(prismaMock.session.update).toHaveBeenCalledWith({
      where: { id: "s-1" },
      data: { expiresAt, lastSeenAt: NOW },
    });
  });

  it("does not write when refresh is not requested", async () => {
    const token = await newToken();
    prismaMock.session.findUnique.mockResolvedValue({
      id: "s-1",
      expiresAt: new Date(NOW.getTime() + 1000),
      lastSeenAt: new Date(NOW.getTime() - SESSION_REFRESH_AFTER_MS - 1),
      user,
    });

    await validateSession(token);
    expect(prismaMock.session.update).not.toHaveBeenCalled();
  });
});

describe("revokeSession", () => {
  it("deletes by token hash", async () => {
    const token = await newToken();

    await revokeSession(token);

    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: sha256(token) },
    });
  });
});
