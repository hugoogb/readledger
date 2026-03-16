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
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));
