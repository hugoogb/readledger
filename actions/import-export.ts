"use server";

import { requireUser } from "@/lib/auth";
import { serializeCsv } from "@/lib/csv";
import { withResult } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import { type ImportFormat, type ImportPreview, type ImportRow, parseImport } from "@/lib/import";
import { prisma } from "@/lib/prisma";
import { checkUserActionLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

export type { ImportPreview } from "@/lib/import";

const CSV_HEADERS = [
  "series_title",
  "volume_number",
  "owned",
  "read",
  "wishlist",
  "price_paid",
  "store",
  "condition",
  "purchase_date",
  "read_date",
  "notes",
  "isbn",
];

type ExportFormat = ImportFormat;

export async function exportCollection(format: ExportFormat) {
  const user = await requireUser();

  const series = await prisma.series.findMany({
    where: { userId: user.id },
    include: {
      volumes: {
        include: { store: true },
        orderBy: { volumeNumber: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });

  if (format === "json") {
    const data = series.map((s) => ({
      title: s.title,
      author: s.author,
      status: s.status,
      publishing: s.publishing,
      totalVolumes: s.totalVolumes,
      retailPrice: s.retailPrice,
      coverImage: s.coverImage,
      description: s.description,
      mangadexId: s.mangadexId,
      volumes: s.volumes.map((v) => ({
        volumeNumber: v.volumeNumber,
        owned: v.owned,
        read: v.read,
        wishlist: v.wishlist,
        pricePaid: v.pricePaid,
        store: v.store?.name || null,
        condition: v.condition,
        purchaseDate: v.purchaseDate?.toISOString().split("T")[0] || null,
        readDate: v.readDate?.toISOString().split("T")[0] || null,
        notes: v.notes,
        isbn: v.isbn,
        coverImage: v.coverImage,
      })),
    }));

    return JSON.stringify(data, null, 2);
  }

  // CSV format - one row per volume
  const rows: string[][] = [];
  for (const s of series) {
    for (const v of s.volumes) {
      rows.push([
        s.title,
        String(v.volumeNumber),
        v.owned ? "yes" : "no",
        v.read ? "yes" : "no",
        v.wishlist ? "yes" : "no",
        v.pricePaid != null ? String(v.pricePaid) : "",
        v.store?.name || "",
        v.condition || "",
        v.purchaseDate?.toISOString().split("T")[0] || "",
        v.readDate?.toISOString().split("T")[0] || "",
        v.notes || "",
        v.isbn || "",
      ]);
    }
  }

  return serializeCsv(CSV_HEADERS, rows);
}

export const previewImport = withResult(
  async (data: string, format: ImportFormat): Promise<ImportPreview> => {
    const user = await requireUser();
    checkUserActionLimit(user.id);
    return parseImport(data, format);
  },
);

const toDate = (value: string | null) => (value ? new Date(value) : null);

export const importCollection = withResult(async (data: string, format: ImportFormat) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const preview = parseImport(data, format);

  if (preview.errors.length > 0) {
    throw new ValidationError(
      `Import has ${preview.errors.length} errors. Fix them before importing.`,
    );
  }

  if (preview.rows.length === 0) {
    throw new ValidationError("No data to import");
  }

  // Group rows by series
  const seriesMap = new Map<string, ImportRow[]>();
  for (const row of preview.rows) {
    const existing = seriesMap.get(row.seriesTitle) || [];
    existing.push(row);
    seriesMap.set(row.seriesTitle, existing);
  }

  // One import is one transaction; large collections need more than Prisma's
  // default 5 s for the sequential upserts.
  await prisma.$transaction(
    async (tx) => {
      const storeIds = new Map(
        (
          await tx.userStore.findMany({
            where: { userId: user.id },
            select: { id: true, name: true },
          })
        ).map((s) => [s.name, s.id]),
      );

      const resolveStore = async (name: string | null) => {
        if (!name) return null;
        let id = storeIds.get(name);
        if (!id) {
          id = (await tx.userStore.create({ data: { userId: user.id, name } })).id;
          storeIds.set(name, id);
        }
        return id;
      };

      for (const [title, volumes] of seriesMap) {
        const meta = preview.seriesMeta[title];

        // Match an existing series by MangaDex id first (titles can change),
        // then by title. Existing series keep their own metadata.
        let series =
          (meta?.mangadexId &&
            (await tx.series.findFirst({
              where: { userId: user.id, mangadexId: meta.mangadexId },
            }))) ||
          (await tx.series.findFirst({ where: { userId: user.id, title } }));

        if (!series) {
          const maxVolume = Math.max(...volumes.map((v) => v.volumeNumber));
          series = await tx.series.create({
            data: {
              userId: user.id,
              title,
              totalVolumes: Math.max(meta?.totalVolumes ?? 0, maxVolume),
              ...(meta && {
                author: meta.author,
                ...(meta.status && { status: meta.status }),
                publishing: meta.publishing,
                retailPrice: meta.retailPrice,
                coverImage: meta.coverImage,
                description: meta.description,
                mangadexId: meta.mangadexId,
              }),
            },
          });
        }

        for (const vol of volumes) {
          const fields = {
            owned: vol.owned,
            read: vol.read,
            wishlist: vol.wishlist,
            pricePaid: vol.pricePaid,
            storeId: await resolveStore(vol.store),
            condition: vol.condition,
            purchaseDate: toDate(vol.purchaseDate),
            readDate: toDate(vol.readDate),
            notes: vol.notes,
            isbn: vol.isbn,
            ...(vol.coverImage && { coverImage: vol.coverImage }),
          };

          await tx.volume.upsert({
            where: {
              seriesId_volumeNumber: {
                seriesId: series.id,
                volumeNumber: vol.volumeNumber,
              },
            },
            create: { seriesId: series.id, volumeNumber: vol.volumeNumber, ...fields },
            update: fields,
          });
        }
      }
    },
    { timeout: 120_000, maxWait: 10_000 },
  );

  revalidatePath("/dashboard", "layout");

  return { seriesCount: seriesMap.size, volumeCount: preview.rows.length };
});
