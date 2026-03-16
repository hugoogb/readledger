"use server";

import { requireUser } from "@/lib/auth";
import { parseCsv, serializeCsv } from "@/lib/csv";
import { Condition } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const VALID_CONDITIONS = new Set(Object.values(Condition));

function parseCondition(value: string | null): Condition | null {
  if (!value || !VALID_CONDITIONS.has(value as Condition)) return null;
  return value as Condition;
}

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

type ExportFormat = "csv" | "json";

const MAX_IMPORT_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMPORT_ROWS = 10_000;

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

type ImportRow = {
  seriesTitle: string;
  volumeNumber: number;
  owned: boolean;
  read: boolean;
  wishlist: boolean;
  pricePaid: number | null;
  store: string | null;
  condition: string | null;
  purchaseDate: string | null;
  readDate: string | null;
  notes: string | null;
  isbn: string | null;
};

export type ImportPreview = {
  rows: ImportRow[];
  errors: { row: number; message: string }[];
  seriesCount: number;
  volumeCount: number;
};

export async function previewImport(
  data: string,
  format: ExportFormat,
): Promise<ImportPreview> {
  const rows: ImportRow[] = [];
  const errors: { row: number; message: string }[] = [];

  if (data.length > MAX_IMPORT_SIZE) {
    return { rows: [], errors: [{ row: 0, message: "File too large. Maximum size is 5 MB." }], seriesCount: 0, volumeCount: 0 };
  }

  if (format === "json") {
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        return { rows: [], errors: [{ row: 0, message: "Expected an array" }], seriesCount: 0, volumeCount: 0 };
      }

      for (let si = 0; si < parsed.length; si++) {
        const s = parsed[si];
        if (!s.title) {
          errors.push({ row: si + 1, message: `Series ${si + 1}: missing title` });
          continue;
        }
        if (!Array.isArray(s.volumes)) continue;

        for (const v of s.volumes) {
          rows.push({
            seriesTitle: s.title,
            volumeNumber: Number(v.volumeNumber) || 0,
            owned: !!v.owned,
            read: !!v.read,
            wishlist: !!v.wishlist,
            pricePaid: v.pricePaid != null ? Number(v.pricePaid) : null,
            store: v.store || null,
            condition: v.condition || null,
            purchaseDate: v.purchaseDate || null,
            readDate: v.readDate || null,
            notes: v.notes || null,
            isbn: v.isbn || null,
          });
        }
      }
    } catch {
      errors.push({ row: 0, message: "Invalid JSON" });
    }
  } else {
    const { headers, rows: csvRows } = parseCsv(data);

    const headerMap = new Map<string, number>();
    headers.forEach((h, i) => headerMap.set(h.trim().toLowerCase(), i));

    const getCol = (row: string[], name: string) => {
      const idx = headerMap.get(name);
      return idx !== undefined ? row[idx]?.trim() || "" : "";
    };

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const title = getCol(row, "series_title");
      const volNum = getCol(row, "volume_number");

      if (!title) {
        errors.push({ row: i + 2, message: "Missing series_title" });
        continue;
      }
      if (!volNum || isNaN(Number(volNum))) {
        errors.push({ row: i + 2, message: "Invalid volume_number" });
        continue;
      }

      const pricePaidStr = getCol(row, "price_paid");

      rows.push({
        seriesTitle: title,
        volumeNumber: Number(volNum),
        owned: getCol(row, "owned").toLowerCase() === "yes",
        read: getCol(row, "read").toLowerCase() === "yes",
        wishlist: getCol(row, "wishlist").toLowerCase() === "yes",
        pricePaid: pricePaidStr ? Number(pricePaidStr) : null,
        store: getCol(row, "store") || null,
        condition: getCol(row, "condition") || null,
        purchaseDate: getCol(row, "purchase_date") || null,
        readDate: getCol(row, "read_date") || null,
        notes: getCol(row, "notes") || null,
        isbn: getCol(row, "isbn") || null,
      });
    }
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    return { rows: [], errors: [{ row: 0, message: `Too many rows. Maximum is ${MAX_IMPORT_ROWS}.` }], seriesCount: 0, volumeCount: 0 };
  }

  const seriesNames = new Set(rows.map((r) => r.seriesTitle));

  return {
    rows,
    errors,
    seriesCount: seriesNames.size,
    volumeCount: rows.length,
  };
}

export async function importCollection(
  data: string,
  format: ExportFormat,
) {
  const user = await requireUser();
  const preview = await previewImport(data, format);

  if (preview.errors.length > 0) {
    throw new Error(`Import has ${preview.errors.length} errors. Fix them before importing.`);
  }

  if (preview.rows.length === 0) {
    throw new Error("No data to import");
  }

  // Group rows by series
  const seriesMap = new Map<string, ImportRow[]>();
  for (const row of preview.rows) {
    const existing = seriesMap.get(row.seriesTitle) || [];
    existing.push(row);
    seriesMap.set(row.seriesTitle, existing);
  }

  // Process in a transaction
  await prisma.$transaction(async (tx) => {
    for (const [title, volumes] of seriesMap) {
      // Find or create series
      let series = await tx.series.findFirst({
        where: { userId: user.id, title },
      });

      if (!series) {
        series = await tx.series.create({
          data: {
            userId: user.id,
            title,
            totalVolumes: Math.max(...volumes.map((v) => v.volumeNumber)),
          },
        });
      }

      // Resolve stores
      const storeCache = new Map<string, string>();
      for (const vol of volumes) {
        if (vol.store && !storeCache.has(vol.store)) {
          let store = await tx.userStore.findFirst({
            where: { userId: user.id, name: vol.store },
          });
          if (!store) {
            store = await tx.userStore.create({
              data: { userId: user.id, name: vol.store },
            });
          }
          storeCache.set(vol.store, store.id);
        }
      }

      // Upsert volumes
      for (const vol of volumes) {
        await tx.volume.upsert({
          where: {
            seriesId_volumeNumber: {
              seriesId: series.id,
              volumeNumber: vol.volumeNumber,
            },
          },
          create: {
            seriesId: series.id,
            volumeNumber: vol.volumeNumber,
            owned: vol.owned,
            read: vol.read,
            wishlist: vol.wishlist,
            pricePaid: vol.pricePaid,
            storeId: vol.store ? storeCache.get(vol.store) || null : null,
            condition: parseCondition(vol.condition),
            purchaseDate: vol.purchaseDate ? new Date(vol.purchaseDate) : null,
            readDate: vol.readDate ? new Date(vol.readDate) : null,
            notes: vol.notes,
            isbn: vol.isbn,
          },
          update: {
            owned: vol.owned,
            read: vol.read,
            wishlist: vol.wishlist,
            pricePaid: vol.pricePaid,
            storeId: vol.store ? storeCache.get(vol.store) || null : null,
            condition: parseCondition(vol.condition),
            purchaseDate: vol.purchaseDate ? new Date(vol.purchaseDate) : null,
            readDate: vol.readDate ? new Date(vol.readDate) : null,
            notes: vol.notes,
            isbn: vol.isbn,
          },
        });
      }
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");

  return { seriesCount: seriesMap.size, volumeCount: preview.rows.length };
}
