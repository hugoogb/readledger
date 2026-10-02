import { vi, beforeEach } from "vitest";
import { prismaMock } from "@/__tests__/__mocks__/prisma";
import {
  deleteReadingGoal,
  getReadingGoals,
  getReadingVolumes,
  upsertReadingGoal,
} from "@/services/reading";

beforeEach(() => vi.clearAllMocks());

describe("getReadingVolumes", () => {
  it("loads only the user's owned or read volumes with slim fields", async () => {
    prismaMock.volume.findMany.mockResolvedValue([]);

    await getReadingVolumes("user-1");

    const args = prismaMock.volume.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      series: { userId: "user-1" },
      OR: [{ owned: true }, { read: true }],
    });
    expect(args.select).toMatchObject({
      purchaseDate: true,
      readDate: true,
      series: { select: { title: true, coverImage: true } },
    });
  });
});

describe("getReadingGoals", () => {
  it("returns the user's goals, newest year first", async () => {
    prismaMock.readingGoal.findMany.mockResolvedValue([]);

    await getReadingGoals("user-1");

    expect(prismaMock.readingGoal.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { year: true, target: true },
      orderBy: { year: "desc" },
    });
  });
});

describe("upsertReadingGoal", () => {
  it("creates or updates the goal for the user's year", async () => {
    prismaMock.readingGoal.upsert.mockResolvedValue({});

    await upsertReadingGoal("user-1", { year: 2026, target: 60 });

    expect(prismaMock.readingGoal.upsert).toHaveBeenCalledWith({
      where: { userId_year: { userId: "user-1", year: 2026 } },
      create: { userId: "user-1", year: 2026, target: 60 },
      update: { target: 60 },
    });
  });
});

describe("deleteReadingGoal", () => {
  it("deletes only the user's goal and tolerates a missing one", async () => {
    prismaMock.readingGoal.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteReadingGoal("user-1", 2026)).resolves.toBeUndefined();

    expect(prismaMock.readingGoal.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", year: 2026 },
    });
  });
});
