import { vi } from "vitest";

export const prismaMock = {
  series: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  volume: {
    create: vi.fn(),
    createMany: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  readingGoal: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  otpCode: {
    create: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
  // Interactive transactions run the callback against the same mock client.
  $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prismaMock)),
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));
