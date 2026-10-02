import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

// Publishers and stores are per-user. Reject ids belonging to someone else so
// a series/volume can't be linked to (and leak the name of) another user's row.

export async function assertOwnedPublisher(userId: string, publisherId: string | null | undefined) {
  if (!publisherId) return;
  const found = await prisma.publisher.findFirst({
    where: { id: publisherId, userId },
    select: { id: true },
  });
  if (!found) throw new NotFoundError("Publisher");
}

export async function assertOwnedStore(userId: string, storeId: string | null | undefined) {
  if (!storeId) return;
  const found = await prisma.userStore.findFirst({
    where: { id: storeId, userId },
    select: { id: true },
  });
  if (!found) throw new NotFoundError("Store");
}
