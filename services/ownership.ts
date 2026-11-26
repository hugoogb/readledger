import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

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
